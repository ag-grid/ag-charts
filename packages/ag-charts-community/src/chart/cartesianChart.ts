import { Logger, type ModuleInstance, type Size, entries, groupBy } from 'ag-charts-core';
import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { staticFromToMotion } from '../motion/fromToMotion';
import type { BBox } from '../scene/bbox';
import { clampArray } from '../util/number';
import { ActionOnSet } from '../util/proxy';
import type { AxisPrimaryTickCount } from '../util/secondaryAxisTicks';
import { CartesianAxis } from './axis/cartesianAxis';
import { NumberAxis } from './axis/numberAxis';
import { stackCartesianSeries } from './cartesianUtil';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';
import { CartesianCrossLine } from './crossline/cartesianCrossLine';
import type { LayoutContext } from './layout/layoutManager';
import type { SeriesArea } from './series-area/seriesArea';
import { CartesianSeries } from './series/cartesian/cartesianSeries';
import type { UnknownSeries } from './series/series';

type Dimension = 'x' | 'y';
type Direction = -1 | 1;
type AreaWidthMap = Map<AgCartesianAxisPosition, number>;

interface State {
    axisAreaWidths: AreaWidthMap;
    clipSeries: boolean;
    overflows: boolean;
}

const directions: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];

interface SyncModule extends ModuleInstance {
    enabled?: boolean;
    getSyncedDomain(axis: ChartAxis): Promise<any[] | undefined>;
    removeAxis(axis: ChartAxis): void;
    updateSiblings(): void;
}

export class CartesianChart extends Chart {
    static readonly className = 'CartesianChart';
    static readonly type = 'cartesian';

    private static readonly AxesPadding = 15; // TODO should come from theme

    /** Integrated Charts feature state - not used in Standalone Charts. */
    public readonly paired: boolean = true;

    @ActionOnSet<CartesianChart>({
        changeValue(newValue, oldValue) {
            this.onAxisChange(newValue, oldValue);
        },
    })
    override axes: CartesianAxis[] = [];

    private lastAreaWidths?: AreaWidthMap;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
    }

    override onAxisChange(newValue: CartesianAxis[], oldValue?: CartesianAxis[]) {
        super.onAxisChange(newValue, oldValue);

        this.syncAxisChanges(newValue, oldValue);

        if (this.ctx != null) {
            this.ctx.zoomManager.updateAxes(newValue);
        }
    }

    override destroySeries(series: UnknownSeries[]) {
        super.destroySeries(series);

        this.lastLayoutWidth = Number.NaN;
        this.lastLayoutHeight = Number.NaN;
    }

    override getChartType() {
        return 'cartesian' as const;
    }

    private setRootClipRects(clipRect: BBox | undefined) {
        const { seriesRoot, annotationRoot } = this;
        seriesRoot.setClipRect(clipRect);
        annotationRoot.setClipRect(clipRect);
    }

    private lastUpdateClipRect: BBox | undefined = undefined;

    override async processData(): Promise<void> {
        await super.processData();

        if (this.syncStatus === 'init') {
            this.syncStatus = 'domains-calculated';
        }

        this.ctx.updateService.dispatchProcessData({ series: { shouldFlipXY: this.shouldFlipXY() } });
    }

    override async processDomains() {
        await super.processDomains();

        for (const axis of this.axes) {
            const syncedDomain = await this.getSyncedDomain(axis);

            if (syncedDomain != null) {
                axis.setDomains(syncedDomain);
            }
        }
    }

    private lastLayoutWidth = Number.NaN;
    private lastLayoutHeight = Number.NaN;
    protected performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot } = this;
        const { clipSeries, seriesRect, visible } = this.updateAxes(ctx.layoutBox);

        this.seriesRoot.visible = visible;
        this.seriesRect = seriesRect;
        this.animationRect = ctx.layoutBox;

        const { x, y } = seriesRect;
        if (ctx.width !== this.lastLayoutWidth || ctx.height !== this.lastLayoutHeight) {
            // For initial rendering, don't animate.
            for (const group of [seriesRoot, annotationRoot]) {
                group.translationX = Math.floor(x);
                group.translationY = Math.floor(y);
            }
        } else {
            // Animate seriesRect movements - typically caused by axis size changes.
            const { translationX, translationY } = seriesRoot;
            staticFromToMotion(
                this.id,
                'seriesRect',
                this.ctx.animationManager,
                [seriesRoot, annotationRoot],
                { translationX, translationY },
                { translationX: Math.floor(x), translationY: Math.floor(y) },
                { phase: 'update' }
            );
        }

        this.lastLayoutWidth = ctx.width;
        this.lastLayoutHeight = ctx.height;

        const seriesArea = this.modulesManager.getModule('seriesArea') as SeriesArea;
        const seriesPaddedRect = seriesRect.clone().grow(seriesArea.getPadding());

        const clipRect = seriesArea.clip || clipSeries ? seriesPaddedRect : undefined;
        const { lastUpdateClipRect } = this;
        this.lastUpdateClipRect = clipRect;

        if (this.ctx.animationManager.isActive() && lastUpdateClipRect != null) {
            this.ctx.animationManager.animate({
                id: this.id,
                groupId: 'clip-rect',
                phase: 'update',
                from: lastUpdateClipRect,
                to: seriesPaddedRect,
                onUpdate: (interpolatedClipRect) => this.setRootClipRects(interpolatedClipRect),
                onComplete: () => this.setRootClipRects(clipRect),
            });
        } else {
            this.setRootClipRects(clipRect);
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            axes: this.axes.map((axis) => axis.getLayoutState()),
            series: {
                visible,
                rect: seriesRect,
                paddedRect: seriesPaddedRect,
            },
            clipSeries,
        });

        stackCartesianSeries(this.series);
    }

    updateAxes(layoutBox: BBox) {
        const { clipSeries, seriesRect, overflows } = this.resolveAxesLayout(layoutBox);

        for (const axis of this.axes) {
            axis.update();
            axis.setCrossLinesVisible(!overflows);

            this.clipAxis(axis, seriesRect, layoutBox);
        }

        return { clipSeries, seriesRect, visible: !overflows };
    }

    // Iteratively try to resolve axis widths - since X axis width affects Y axis range,
    // and vice-versa, we need to iteratively try and find a fit for the axes and their
    // ticks/labels.
    private resolveAxesLayout(layoutBox: BBox) {
        let newState;
        let prevState;
        let iterations = 0;
        const maxIterations = 10;

        // Axes that have `crossAt` configured
        const crossAtAxes = this.axes.filter((axis) => axis.crossAt?.value != null);

        do {
            // Start with a good approximation from the last update.
            // This should mean that in many resize cases that only a single pass is needed.
            prevState = newState ?? this.getDefaultState();
            newState = this.updateAxesPass(new Map(prevState.axisAreaWidths), layoutBox.clone(), crossAtAxes);

            if (iterations++ > maxIterations) {
                Logger.warn('Max iterations reached. Unable to stabilize axes layout.');
                break;
            }
        } while (!this.isLayoutStable(newState, prevState));

        this.lastAreaWidths = newState.axisAreaWidths;

        return newState;
    }

    private updateAxesPass(axisAreaWidths: AreaWidthMap, axisAreaBound: BBox, crossAtAxes: CartesianAxis[]) {
        const axisWidths: Map<string, number> = new Map();
        const primaryTickCounts: Partial<Record<ChartAxisDirection, AxisPrimaryTickCount>> = {};

        let overflows = false;
        let clipSeries = false;

        for (const dir of directions) {
            const seriesArea = this.modulesManager.getModule('seriesArea') as SeriesArea;
            const padding = seriesArea.getPadding()[dir];
            const axis = this.axes.findLast((a) => a.position === dir);

            if (axis) {
                axis.seriesAreaPadding = padding;
            } else {
                axisAreaBound.shrink(padding, dir);
            }
        }

        const totalWidth = (axisAreaWidths.get('left') ?? 0) + (axisAreaWidths.get('right') ?? 0);
        const totalHeight = (axisAreaWidths.get('top') ?? 0) + (axisAreaWidths.get('bottom') ?? 0);
        const crossLinePadding = this.buildCrossLinePadding(axisAreaWidths);

        const crossLineHPadding = crossLinePadding.left + crossLinePadding.right;
        const crossLineVPadding = crossLinePadding.top + crossLinePadding.bottom;

        if (
            axisAreaBound.width <= totalWidth + crossLineHPadding ||
            axisAreaBound.height <= totalHeight + crossLineVPadding
        ) {
            // Not enough space for rendering
            overflows = true;
        } else {
            axisAreaBound.shrink(crossLinePadding);
        }

        const { scene } = this.ctx;
        const seriesRect = axisAreaBound.clone().shrink(Object.fromEntries(axisAreaWidths));

        // Step 1) Calculate individual axis widths.
        for (const axis of this.axes) {
            const { position = 'left', direction } = axis;
            const isVertical = direction === ChartAxisDirection.Y;
            let axisWidth: number;

            this.sizeAxis(axis, seriesRect, position);

            if (axis.thickness == null) {
                const availableSize = getSize(isVertical, scene);
                axisWidth = availableSize * (axis.maxThicknessRatio ?? 1);
            } else {
                axisWidth = axis.thickness;
            }

            const { primaryTickCount, bbox } = axis.calculateLayout(
                axis.nice ? primaryTickCounts[direction] : undefined,
                { sizeLimit: axisWidth, padding: this.padding }
            );

            primaryTickCounts[direction] ??= primaryTickCount;
            clipSeries ||= axis.dataDomain.clipped || axis.visibleRange[0] > 0 || axis.visibleRange[1] < 1;

            if (axis.thickness == null) {
                axisWidth = Math.min(getSize(isVertical, bbox) ?? 0, axisWidth);
            }
            axisWidths.set(axis.id, Math.ceil(axisWidth));
        }

        // adjust axis widths for crossAt axes and calculate cross positions
        let crossPositions: Map<string, number> | undefined;
        if (crossAtAxes.length > 0) {
            crossPositions = this.calculateAxesCrossPositions(axisWidths, seriesRect, crossAtAxes);
        }

        const axisGroups = groupBy(this.axes, (axis) => axis.position ?? 'left');

        // Step 2) calculate axis offsets and total depth for each position.
        const newAxisAreaWidths: AreaWidthMap = new Map();
        const axisOffsets = new Map<string, number>();

        for (const [position, axes] of entries(axisGroups)) {
            // Adjust offset for pixel ratio to prevent alignment issues with series rendering.
            let currentOffset = getSize(position !== 'left' && position !== 'right', scene) % scene.pixelRatio;
            let totalAxisWidth = 0;

            for (const axis of axes ?? []) {
                axisOffsets.set(axis.id, currentOffset);

                const axisThickness = axisWidths.get(axis.id) ?? 0;
                totalAxisWidth = Math.max(totalAxisWidth, currentOffset + axisThickness);
                if (axis.layoutConstraints.stacked) {
                    // for multiple axes in the same direction and position, apply padding at the top of each inner axis (i.e. between axes).
                    currentOffset += axisThickness + CartesianChart.AxesPadding;
                }
            }

            newAxisAreaWidths.set(position, Math.ceil(totalAxisWidth));
        }

        // Step 3) position all axes taking adjacent positions into account.
        for (const [position, axes] of entries(axisGroups)) {
            this.positionAxes({
                axes: axes ?? [],
                position,
                axisWidths,
                axisOffsets,
                axisAreaWidths: newAxisAreaWidths,
                axisBound: axisAreaBound,
                seriesRect,
            });
        }

        if (crossPositions != null) {
            this.applyAxisCrossing(seriesRect, crossPositions);
        }

        return { clipSeries, seriesRect, axisAreaWidths: newAxisAreaWidths, overflows };
    }

    private calculateAxesCrossPositions(
        axisWidths: Map<string, number>,
        seriesRect: BBox,
        crossAtAxes: CartesianAxis[]
    ): Map<string, number> {
        const crossPositions = new Map<string, number>();
        const primaryXAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.X);
        const primaryYAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.Y);

        for (const axis of crossAtAxes) {
            const { crossPosition, visible } = this.calculateAxisCrossPosition(axis, primaryXAxis, primaryYAxis);

            axis.setAxisVisible(visible);

            this.adjustAxisWidth(axis, axisWidths, crossPosition, seriesRect, visible);

            if (crossPosition == undefined) continue;

            crossPositions.set(axis.id, crossPosition);
        }

        return crossPositions;
    }

    private calculateAxisCrossPosition(
        axis: CartesianAxis,
        primaryXAxis: CartesianAxis | undefined,
        primaryYAxis: CartesianAxis | undefined
    ): { crossPosition: number | undefined; visible: boolean } {
        const perpendicularAxis = axis.direction === ChartAxisDirection.X ? primaryYAxis : primaryXAxis;
        if (!perpendicularAxis) return { crossPosition: undefined, visible: true };

        const {
            scale: { domain, bandwidth },
            range,
        } = perpendicularAxis;
        const halfBandwidth = (bandwidth ?? 0) / 2;

        const crossPosition = perpendicularAxis.scale.convert(axis.crossAt?.value, { clamp: false }) + halfBandwidth;

        if (perpendicularAxis.inRange(crossPosition)) return { crossPosition, visible: true };

        if (axis.crossAt?.sticky === false) {
            return { crossPosition: undefined, visible: false };
        }

        const clampedPosition = Number.isNaN(crossPosition) ? range[domain[0]] : clampArray(crossPosition, range);

        return { crossPosition: clampedPosition, visible: true };
    }

    private adjustAxisWidth(
        axis: CartesianAxis,
        axisWidths: Map<string, number>,
        crossPosition: number | undefined,
        seriesRect: BBox,
        visible: boolean
    ): void {
        const crosshairModule = axis.getModuleMap().getModule('crosshair') as { enabled: boolean } | undefined;
        if (crosshairModule?.enabled) return;

        const annotationsModule = this.modulesManager.getModule('annotations') as { enabled: boolean } | undefined;
        const hasAnnotations =
            annotationsModule?.enabled === true ||
            this.ctx.annotationManager.createMemento().some((annotation) => {
                switch (annotation.type) {
                    case 'vertical-line':
                        return axis.direction === ChartAxisDirection.X;
                    case 'horizontal-line':
                        return axis.direction === ChartAxisDirection.Y;
                }
            });
        if (hasAnnotations) return;

        const currentWidth = axisWidths.get(axis.id) ?? 0;
        const adjustedWidth = visible
            ? this.calculateAxisBleedingWidth(axis, currentWidth, crossPosition, seriesRect)
            : 0;
        axisWidths.set(axis.id, adjustedWidth);
    }

    private calculateAxisBleedingWidth(
        axis: CartesianAxis,
        actualWidth: number,
        crossPosition: number | undefined,
        seriesRect: BBox
    ): number {
        if (crossPosition == null) return actualWidth;

        switch (axis.position) {
            case 'left':
            case 'top':
                return Math.max(0, actualWidth - crossPosition);
            case 'right':
                return Math.max(0, crossPosition + actualWidth - seriesRect.width);
            case 'bottom':
                return Math.max(0, crossPosition + actualWidth - seriesRect.height);
            default:
                return actualWidth;
        }
    }

    private applyAxisCrossing(seriesRect: BBox, crossPositions: Map<string, number>) {
        for (const axis of this.axes) {
            const crossPosition = crossPositions.get(axis.id);
            if (crossPosition == null) {
                axis.crossAxisTranslation.x = 0;
                axis.crossAxisTranslation.y = 0;
                continue;
            }

            const isXDirection = axis.direction === ChartAxisDirection.X;
            axis.crossAxisTranslation.x = isXDirection ? 0 : seriesRect.x + crossPosition - axis.translation.x;
            axis.crossAxisTranslation.y = isXDirection ? seriesRect.y + crossPosition - axis.translation.y : 0;
        }
    }

    private buildCrossLinePadding(axisAreaSize: AreaWidthMap) {
        const crossLinePadding = { top: 0, right: 0, bottom: 0, left: 0 };

        for (const axis of this.axes) {
            const { position, label } = axis;
            if (axis.crossLines) {
                for (const crossLine of axis.crossLines) {
                    if (crossLine instanceof CartesianCrossLine) {
                        crossLine.position = position ?? 'top';
                        crossLine.label.parallel ??= label.parallel;
                    }

                    crossLine.calculatePadding?.(crossLinePadding);
                }
            }
        }
        // Reduce cross-line padding to account for overlap with axes.
        for (const [side, padding = 0] of entries(crossLinePadding)) {
            crossLinePadding[side] = Math.max(padding - (axisAreaSize.get(side as AgCartesianAxisPosition) ?? 0), 0);
        }

        return crossLinePadding;
    }

    private clampToOutsideSeriesRect(seriesRect: BBox, value: number, dimension: Dimension, direction: Direction) {
        const bound = dimension === 'x' ? seriesRect.x : seriesRect.y;
        const size = dimension === 'x' ? seriesRect.width : seriesRect.height;

        return direction === 1 ? Math.min(value, bound + size) : Math.max(value, bound);
    }

    private async getSyncedDomain(axis: CartesianAxis) {
        const syncModule = this.modulesManager.getModule('sync') as SyncModule;
        if (!syncModule?.enabled) return;
        return await syncModule.getSyncedDomain(axis);
    }

    private syncAxisChanges(newValue: CartesianAxis[], oldValue: CartesianAxis[] | undefined) {
        const syncModule = this.modulesManager.getModule('sync') as SyncModule;
        if (!syncModule?.enabled) return;

        const removed = new Set(oldValue ?? []);
        for (const axis of newValue) {
            removed.delete(axis);
        }
        for (const removedAxis of removed) {
            syncModule.removeAxis(removedAxis);
        }
    }

    private sizeAxis(axis: CartesianAxis, seriesRect: BBox, position: AgCartesianAxisPosition) {
        const isNumberAxis = axis instanceof NumberAxis; // Number, log axis
        const isLeftRight = position === 'left' || position === 'right';

        const { width, height } = seriesRect;
        const maxEnd = isLeftRight ? height : width;

        let start = 0;
        let end = maxEnd;
        let { min, max } = this.ctx.zoomManager.getAxisZoom(axis.id);

        const { width: axisWidth, unit, align } = axis.layoutConstraints;

        if (unit === 'px') {
            end = start + axisWidth;
        } else {
            end = (end * axisWidth) / 100;
        }

        if (align === 'end') {
            start = maxEnd - (end - start);
            end = maxEnd;
        }

        if (isLeftRight) {
            if (isNumberAxis) {
                [start, end] = [end, start];
            } else {
                [min, max] = [1 - max, 1 - min];
            }
        }

        axis.range = [start, end];
        axis.visibleRange = [min, max];
        axis.gridLength = isLeftRight ? width : height;
    }

    private positionAxes(opts: {
        axes: CartesianAxis[];
        position: AgCartesianAxisPosition;
        axisBound: BBox;
        axisWidths: Map<string, number>;
        axisOffsets: Map<string, number>;
        axisAreaWidths: AreaWidthMap;
        seriesRect: BBox;
    }) {
        const { axes, axisBound, axisWidths, axisOffsets, axisAreaWidths, seriesRect, position } = opts;
        const axisAreaWidth = axisAreaWidths.get(position) ?? 0;

        let mainDimension: Dimension = 'x';
        let minorDimension: Dimension = 'y';
        let direction: Direction = 1;

        if (position === 'top' || position === 'bottom') {
            mainDimension = 'y';
            minorDimension = 'x';
        }

        let axisBoundMainOffset = axisBound[mainDimension];

        if (position === 'right' || position === 'bottom') {
            direction = -1;
            axisBoundMainOffset += mainDimension === 'x' ? axisBound.width : axisBound.height;
        }

        for (const axis of axes) {
            const minorOffset = axisAreaWidths.get(minorDimension === 'x' ? 'left' : 'top') ?? 0;
            const axisThickness = axisWidths.get(axis.id) ?? 0;
            const axisOffset = axisOffsets.get(axis.id) ?? 0;

            axis.gridPadding = axisAreaWidth - axisOffset - axisThickness;
            axis.translation[minorDimension] = axisBound[minorDimension] + minorOffset;
            axis.translation[mainDimension] = this.clampToOutsideSeriesRect(
                seriesRect,
                axisBoundMainOffset + direction * (axisOffset + axisThickness),
                mainDimension,
                direction
            );
        }
    }

    private shouldFlipXY() {
        // Only flip the xy axes if all the series agree on flipping
        return this.series.every((series) => series instanceof CartesianSeries && series.shouldFlipXY());
    }

    private getDefaultState(): State {
        const axisAreaWidths: AreaWidthMap = new Map();

        if (this.lastAreaWidths) {
            // Clean any positions which aren't valid with the current axis status,
            // Otherwise we end up never being able to find a stable result.
            for (const { position = 'left' } of this.axes) {
                const areaWidth = this.lastAreaWidths.get(position);
                if (areaWidth != null) {
                    axisAreaWidths.set(position, areaWidth);
                }
            }
        }

        return { axisAreaWidths, clipSeries: false, overflows: false };
    }

    private isLayoutStable(newState: State, prevState: State) {
        if (prevState.overflows !== newState.overflows || prevState.clipSeries !== newState.clipSeries) {
            return false;
        }
        // Check for new axis positions.
        for (const key of newState.axisAreaWidths.keys()) {
            if (!prevState.axisAreaWidths.has(key)) {
                return false;
            }
        }
        // Check for existing axis positions and equality.
        for (const [p, w] of prevState.axisAreaWidths.entries()) {
            const otherW = newState.axisAreaWidths.get(p);
            if ((w != null || otherW != null) && w !== otherW) {
                return false;
            }
        }
        return true;
    }

    private clipAxis(axis: CartesianAxis, seriesRect: BBox, layoutBBox: BBox) {
        const gridLinePadding = Math.ceil(axis.gridLine?.width ?? 0);
        const axisLinePadding = Math.ceil(axis.line?.width ?? 0);

        let { width, height } = seriesRect;

        width += axis.direction === ChartAxisDirection.X ? gridLinePadding : axisLinePadding;
        height += axis.direction === ChartAxisDirection.Y ? gridLinePadding : axisLinePadding;

        axis.clipGrid(seriesRect.x, seriesRect.y, width, height);

        switch (axis.position) {
            case 'left':
            case 'right':
                axis.clipTickLines(
                    layoutBBox.x,
                    seriesRect.y - gridLinePadding,
                    layoutBBox.width + gridLinePadding,
                    seriesRect.height + gridLinePadding * 2
                );
                break;
            case 'top':
            case 'bottom':
                axis.clipTickLines(
                    seriesRect.x - gridLinePadding,
                    layoutBBox.y,
                    seriesRect.width + gridLinePadding * 2,
                    layoutBBox.height + gridLinePadding
                );
                break;
        }
    }
}

function getSize(isVertical: boolean, bounds: Size): number;
function getSize(isVertical: boolean, bounds?: Size): number | undefined;
function getSize(isVertical: boolean, bounds?: Size) {
    return isVertical ? bounds?.width : bounds?.height;
}
