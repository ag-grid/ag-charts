import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { LayoutContext, ModuleInstance } from '../module/baseModule';
import type { ChartOptions } from '../module/optionsModule';
import { staticFromToMotion } from '../motion/fromToMotion';
import { ContinuousScale } from '../scale/continuousScale';
import type { BBox } from '../scene/bbox';
import { arraysEqual, groupBy } from '../util/array';
import { Logger } from '../util/logger';
import { findMinMax } from '../util/number';
import { CategoryAxis } from './axis/categoryAxis';
import { GroupedCategoryAxis } from './axis/groupedCategoryAxis';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';
import { CartesianSeries } from './series/cartesian/cartesianSeries';
import type { Series } from './series/series';

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
    getSyncedDomain(axis: ChartAxis): any[] | undefined;
    updateSiblings(): void;
}

export class CartesianChart extends Chart {
    static readonly className = 'CartesianChart';
    static readonly type = 'cartesian';

    static AxesPadding = 15; // TODO should come from theme

    /** Integrated Charts feature state - not used in Standalone Charts. */
    public readonly paired: boolean = true;

    private lastAreaWidths?: AreaWidthMap;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
    }

    private firstSeriesTranslation = true;

    override onAxisChange(newValue: ChartAxis[], oldValue?: ChartAxis[]) {
        super.onAxisChange(newValue, oldValue);
        this.ctx?.zoomManager.updateAxes(newValue);
    }

    override destroySeries(series: Series<any, any>[]) {
        super.destroySeries(series);

        this.firstSeriesTranslation = true;
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

    protected performLayout(ctx: LayoutContext) {
        const { firstSeriesTranslation, seriesRoot, annotationRoot } = this;
        const { clipSeries, seriesRect, visible } = this.updateAxes(ctx.layoutBox);

        this.seriesRoot.visible = visible;
        this.seriesRect = seriesRect;
        this.animationRect = ctx.layoutBox;

        const { x, y } = seriesRect;
        if (firstSeriesTranslation) {
            // For initial rendering, don't animate.
            for (const group of [seriesRoot, annotationRoot]) {
                group.translationX = Math.floor(x);
                group.translationY = Math.floor(y);
            }
            this.firstSeriesTranslation = false;
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

        // Recreate padding object to prevent issues with getters in `BBox.shrink()`
        const seriesPaddedRect = seriesRect.clone().grow(this.seriesArea.padding);

        const clipRect = this.seriesArea.clip || clipSeries ? seriesPaddedRect : undefined;
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
                shouldFlipXY: this.shouldFlipXY(),
            },
            clipSeries,
        });
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

        do {
            // Start with a good approximation from the last update.
            // This should mean that in many resize cases that only a single pass is needed.
            prevState = newState ?? this.getDefaultState();
            newState = this.updateAxesPass(new Map(prevState.axisAreaWidths), layoutBox.clone());

            if (iterations++ > maxIterations) {
                Logger.warn('Max iterations reached. Unable to stabilize axes layout.');
                break;
            }
        } while (!this.isLayoutStable(newState, prevState));

        this.lastAreaWidths = newState.axisAreaWidths;

        return newState;
    }

    private updateAxesPass(axisAreaWidths: AreaWidthMap, axisAreaBound: BBox) {
        const axisWidths: Map<string, number> = new Map();
        const primaryTickCounts: Partial<Record<ChartAxisDirection, number>> = {};

        let overflows = false;
        let clipSeries = false;

        for (const dir of directions) {
            const padding = this.seriesArea.padding[dir];
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

        if (
            axisAreaBound.width <= totalWidth + crossLinePadding.horizontal ||
            axisAreaBound.height <= totalHeight + crossLinePadding.vertical
        ) {
            // Not enough space for rendering
            overflows = true;
        } else {
            axisAreaBound.shrink(crossLinePadding);
        }

        const seriesRect = axisAreaBound.clone().shrink(Object.fromEntries(axisAreaWidths));

        // Step 1) Calculate individual axis widths.
        for (const axis of this.axes) {
            const { position = 'left', direction } = axis;

            this.sizeAxis(axis, seriesRect, position);

            const syncedDomain = this.getSyncedDomain(axis);
            const isVertical = direction === ChartAxisDirection.Y;
            const layout = axis.calculateLayout(syncedDomain, axis.nice ? primaryTickCounts[direction] : undefined);

            primaryTickCounts[direction] ??= layout.primaryTickCount;
            clipSeries ||= axis.dataDomain.clipped || axis.visibleRange[0] > 0 || axis.visibleRange[1] < 1;

            axisWidths.set(axis.id, Math.ceil(axis.thickness || (isVertical ? layout.bbox.width : layout.bbox.height)));
        }

        const axisGroups = Object.entries(groupBy(this.axes, (axis) => axis.position ?? 'left')) as [
            AgCartesianAxisPosition,
            ChartAxis[],
        ][];

        // Step 2) calculate axis offsets and total depth for each position.
        const { width, height, canvas } = this.ctx.scene;
        const newAxisAreaWidths: AreaWidthMap = new Map();
        const axisOffsets = new Map<string, number>();

        for (const [position, axes] of axisGroups) {
            const isVertical = position === 'left' || position === 'right';

            // Adjust offset for pixel ratio to prevent alignment issues with series rendering.
            let currentOffset = isVertical ? height % canvas.pixelRatio : width % canvas.pixelRatio;
            let totalAxisWidth = 0;

            for (const axis of axes) {
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
        for (const [position, axes] of axisGroups) {
            this.positionAxes({
                axes,
                position,
                axisWidths,
                axisOffsets,
                axisAreaWidths: newAxisAreaWidths,
                axisBound: axisAreaBound,
                seriesRect,
            });
        }

        return { clipSeries, seriesRect, axisAreaWidths: newAxisAreaWidths, overflows };
    }

    private buildCrossLinePadding(axisAreaSize: AreaWidthMap) {
        const crossLinePadding = { top: 0, right: 0, bottom: 0, left: 0, horizontal: 0, vertical: 0 };

        this.axes.forEach((axis) => {
            axis.crossLines?.forEach((crossLine) => {
                crossLine.calculatePadding?.(crossLinePadding);
            });
        });
        // Reduce cross-line padding to account for overlap with axes.
        for (const [side, padding = 0] of Object.entries(crossLinePadding) as [AgCartesianAxisPosition, number][]) {
            crossLinePadding[side] = Math.max(padding - (axisAreaSize.get(side) ?? 0), 0);
        }

        crossLinePadding.horizontal = crossLinePadding.left + crossLinePadding.right;
        crossLinePadding.vertical = crossLinePadding.top + crossLinePadding.bottom;

        return crossLinePadding;
    }

    private clampToOutsideSeriesRect(seriesRect: BBox, value: number, dimension: Dimension, direction: Direction) {
        const bound = dimension === 'x' ? seriesRect.x : seriesRect.y;
        const size = dimension === 'x' ? seriesRect.width : seriesRect.height;

        return direction === 1 ? Math.min(value, bound + size) : Math.max(value, bound);
    }

    private getSyncedDomain(axis: ChartAxis) {
        const syncModule = this.modulesManager.getModule<SyncModule>('sync');
        if (!syncModule?.enabled) return;
        const syncedDomain = syncModule.getSyncedDomain(axis);

        // If synced domain available and axis domain is already set.
        if (syncedDomain && axis.dataDomain.domain.length) {
            let shouldUpdate: boolean;
            const { domain } = axis.scale;
            if (ContinuousScale.is(axis.scale)) {
                const [min, max] = findMinMax(syncedDomain);
                shouldUpdate = min !== domain[0] || max !== domain[1];
            } else {
                shouldUpdate = !arraysEqual(syncedDomain, domain);
            }
            if (shouldUpdate && !this.skipSync) {
                syncModule.updateSiblings();
            }
        }

        return syncedDomain;
    }

    private sizeAxis(axis: ChartAxis, seriesRect: BBox, position: AgCartesianAxisPosition) {
        const isCategory = axis instanceof CategoryAxis || axis instanceof GroupedCategoryAxis;
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
            if (isCategory) {
                [min, max] = [1 - max, 1 - min];
            } else {
                [start, end] = [end, start];
            }
        }

        axis.range = [start, end];
        axis.visibleRange = [min, max];
        axis.gridLength = isLeftRight ? width : height;
    }

    private positionAxes(opts: {
        axes: ChartAxis[];
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
            axis.translation[minorDimension] = axisBound[minorDimension] + minorOffset;

            const axisThickness = axisWidths.get(axis.id) ?? 0;
            const axisOffset = axisOffsets.get(axis.id) ?? 0;
            axis.translation[mainDimension] = this.clampToOutsideSeriesRect(
                seriesRect,
                axisBoundMainOffset + direction * (axisOffset + axisThickness),
                mainDimension,
                direction
            );

            axis.gridPadding = axisAreaWidth - axisOffset - axisThickness;

            axis.updatePosition();
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

    private clipAxis(axis: ChartAxis, seriesRect: BBox, layoutBBox: BBox) {
        const gridLinePadding = Math.ceil((axis.gridLine?.width ?? 0) / 2);
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
                    seriesRect.y,
                    layoutBBox.width + gridLinePadding,
                    seriesRect.height + gridLinePadding
                );
                break;
            case 'top':
            case 'bottom':
                axis.clipTickLines(
                    seriesRect.x,
                    layoutBBox.y,
                    seriesRect.width + gridLinePadding,
                    layoutBBox.height + gridLinePadding
                );
                break;
        }
    }
}
