import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { LayoutContext, ModuleInstance } from '../module/baseModule';
import type { ChartOptions } from '../module/optionsModule';
import { staticFromToMotion } from '../motion/fromToMotion';
import { ContinuousScale } from '../scale/continuousScale';
import type { BBox } from '../scene/bbox';
import { arraysEqual } from '../util/array';
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
type VisibilityMap = { crossLines: boolean; series: boolean };

interface State {
    axisAreaWidths: AreaWidthMap;
    clipSeries: boolean;
    overflows: boolean;
    seriesRect: BBox;
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
        const { seriesRect, visible, clipSeries } = this.updateAxes(ctx.layoutBox);

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

    private _lastCrossLineIds?: string[] = undefined;
    private _lastAxisAreaWidths: AreaWidthMap = new Map();
    private _lastClipSeries: boolean = false;
    private _lastVisibility: VisibilityMap = {
        crossLines: true,
        series: true,
    };
    updateAxes(layoutBox: BBox) {
        // FIXME - the crosslines get regenerated when switching between light/dark mode.
        // Ideally, even in this case this updateAxes logic would still work. But there's more work to make that happen.
        const crossLineIds = this.axes.flatMap((axis) => axis.crossLines ?? []).map((crossLine) => crossLine.id);
        const axesValid =
            this._lastCrossLineIds != null &&
            this._lastCrossLineIds.length === crossLineIds.length &&
            this._lastCrossLineIds.every((id, index) => crossLineIds[index] === id);

        let axisAreaWidths: typeof this._lastAxisAreaWidths;
        let clipSeries: boolean;
        let visibility: VisibilityMap;
        if (axesValid) {
            // Start with a good approximation from the last update - this should mean that in many resize
            // cases that only a single pass is needed \o/.
            axisAreaWidths = new Map(this._lastAxisAreaWidths.entries());
            clipSeries = this._lastClipSeries;
            visibility = { ...this._lastVisibility };
        } else {
            axisAreaWidths = new Map();
            clipSeries = false;
            visibility = { crossLines: true, series: true };
            this._lastCrossLineIds = crossLineIds;
        }

        // Clean any positions which aren't valid with the current axis status (otherwise we end up
        // never being able to find a stable result).
        const liveAxisWidths = new Set(this.axes.map((a) => a.position));
        for (const position of axisAreaWidths.keys()) {
            if (!liveAxisWidths.has(position)) {
                axisAreaWidths.delete(position);
            }
        }

        const stableOutputs = <T extends typeof axisAreaWidths>(
            otherAxisWidths: T,
            otherClipSeries: boolean,
            otherVisibility: Partial<VisibilityMap>
        ) => {
            // Check for new axis positions.
            if ([...otherAxisWidths.keys()].some((k) => !axisAreaWidths.has(k))) {
                return false;
            }
            if (
                visibility.crossLines !== otherVisibility.crossLines ||
                visibility.series !== otherVisibility.series ||
                clipSeries !== otherClipSeries
            ) {
                return false;
            }
            // Check for existing axis positions and equality.
            for (const [p, w] of axisAreaWidths.entries()) {
                const otherW = otherAxisWidths.get(p);
                if ((w != null || otherW != null) && w !== otherW) {
                    return false;
                }
            }
            return true;
        };

        // Iteratively try to resolve axis widths - since X axis width affects Y axis range,
        // and vice-versa, we need to iteratively try and find a fit for the axes and their
        // ticks/labels.
        let lastPassAxisAreaWidths: typeof axisAreaWidths = new Map();
        let lastPassVisibility: Partial<VisibilityMap> = {};
        let lastPassClipSeries = false;
        let seriesRect = this.seriesRect?.clone();
        let count = 0;
        do {
            axisAreaWidths = new Map(lastPassAxisAreaWidths.entries());
            clipSeries = lastPassClipSeries;
            Object.assign(visibility, lastPassVisibility);

            const result = this.updateAxesPass(axisAreaWidths, layoutBox.clone(), seriesRect);
            lastPassAxisAreaWidths = result.axisAreaWidths;
            lastPassVisibility = result.visibility;
            lastPassClipSeries = result.clipSeries;
            ({ seriesRect } = result);

            if (count++ > 10) {
                Logger.warn('unable to find stable axis layout.');
                break;
            }
        } while (!stableOutputs(lastPassAxisAreaWidths, lastPassClipSeries, lastPassVisibility));

        for (const axis of this.axes) {
            axis.update();
            axis.setCrossLinesVisible(visibility.crossLines);

            this.clipAxis(axis, seriesRect, layoutBox);
        }

        this._lastAxisAreaWidths = axisAreaWidths;
        this._lastVisibility = visibility;
        this._lastClipSeries = clipSeries;

        this.lastAreaWidths = axisAreaWidths;

        return { clipSeries, seriesRect, visible: visibility.series };
    }

    // Iteratively try to resolve axis widths - since X axis width affects Y axis range,
    // and vice-versa, we need to iteratively try and find a fit for the axes and their
    // ticks/labels.
    // private resolveAxesLayout(axes: ChartAxis[], layoutBox: BBox) {
    //     let newState;
    //     let prevState;
    //     let iterations = 0;
    //     const maxIterations = 10;
    //
    //     do {
    //         // Start with a good approximation from the last update.
    //         // This should mean that in many resize cases that only a single pass is needed.
    //         prevState = newState ?? this.getDefaultState(axes);
    //         newState = this.updateAxesPass(axes, new Map(prevState.axisAreaWidths), layoutBox.clone());
    //
    //         if (iterations++ > maxIterations) {
    //             Logger.warn('Max iterations reached. Unable to stabilize axes layout.');
    //             break;
    //         }
    //     } while (!this.isLayoutStable(newState, prevState));
    //
    //     return newState;
    // }

    private updateAxesPass(axisAreaWidths: AreaWidthMap, bounds: BBox, lastPassSeriesRect?: BBox) {
        const axisWidths: Map<string, number> = new Map();
        const axisGroups: Map<AgCartesianAxisPosition, ChartAxis[]> = new Map();

        const visibility: Partial<VisibilityMap> = {
            series: true,
            crossLines: true,
        };

        let clipSeries = false;

        const primaryTickCounts: Partial<Record<ChartAxisDirection, number>> = {};
        const crossLinePadding = lastPassSeriesRect ? this.buildCrossLinePadding(axisAreaWidths) : {};
        const axisAreaBound = this.buildAxisBound(bounds.clone(), axisAreaWidths, crossLinePadding, visibility);

        // const overflows = this.isAxisOverflow(axisAreaBound, axisAreaWidths);
        const seriesRect = axisAreaBound.clone().shrink(Object.fromEntries(axisAreaWidths.entries()));

        // Step 1) Calculate individual axis widths.
        for (const axis of this.axes) {
            const { position = 'left' } = axis;

            const { clipSeries: newClipSeries, axisThickness } = this.calculateAxisDimensions({
                axis,
                seriesRect,
                primaryTickCounts,
                clipSeries,
            });
            axisWidths.set(axis.id, axisThickness);

            if (!axisGroups.has(position)) axisGroups.set(position, []);
            axisGroups.get(position)?.push(axis);

            clipSeries = clipSeries || newClipSeries;
        }

        // Step 2) calculate axis offsets and total depth for each position.
        const { width, height, canvas } = this.ctx.scene;
        const newAxisAreaWidths: AreaWidthMap = new Map();
        const axisOffsets = new Map<string, number>();

        for (const [position, axes] of axisGroups.entries()) {
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
        for (const [position, axes] of axisGroups.entries()) {
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

        return { clipSeries, seriesRect, axisAreaWidths: newAxisAreaWidths, visibility };
    }

    private buildCrossLinePadding(axisAreaSize: AreaWidthMap) {
        const crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>> = {};

        this.axes.forEach((axis) => {
            axis.crossLines?.forEach((crossLine) => {
                crossLine.calculatePadding?.(crossLinePadding);
            });
        });
        // Reduce cross-line padding to account for overlap with axes.
        for (const [side, padding = 0] of Object.entries(crossLinePadding) as [AgCartesianAxisPosition, number][]) {
            crossLinePadding[side] = Math.max(padding - (axisAreaSize.get(side) ?? 0), 0);
        }

        return crossLinePadding;
    }

    private applySeriesPadding(bounds: BBox) {
        for (const dir of directions) {
            const padding = this.seriesArea.padding[dir];
            const axis = this.axes.findLast((a) => a.position === dir);

            if (axis) {
                axis.seriesAreaPadding = padding;
            } else {
                bounds.shrink(padding, dir);
            }
        }
        return bounds;
    }

    private buildAxisBound(
        bounds: BBox,
        axisAreaWidths: AreaWidthMap,
        crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>>,
        visibility: Partial<VisibilityMap>
    ) {
        const result = this.applySeriesPadding(bounds);
        const { top = 0, right = 0, bottom = 0, left = 0 } = crossLinePadding;
        const horizontalPadding = left + right;
        const verticalPadding = top + bottom;
        const totalWidth = (axisAreaWidths.get('left') ?? 0) + (axisAreaWidths.get('right') ?? 0) + horizontalPadding;
        const totalHeight = (axisAreaWidths.get('top') ?? 0) + (axisAreaWidths.get('bottom') ?? 0) + verticalPadding;
        if (result.width <= totalWidth || result.height <= totalHeight) {
            // Not enough space for crossLines and series
            visibility.crossLines = false;
            visibility.series = false;
            return result;
        }

        result.x += left;
        result.y += top;
        result.width -= horizontalPadding;
        result.height -= verticalPadding;

        return result;
    }

    isAxisOverflow(boundaries: BBox, axisWidths: AreaWidthMap) {
        const totalHorizontalWidth = (axisWidths.get('left') ?? 0) + (axisWidths.get('right') ?? 0);
        const totalVerticalHeight = (axisWidths.get('top') ?? 0) + (axisWidths.get('bottom') ?? 0);

        return boundaries.width <= totalHorizontalWidth || boundaries.height <= totalVerticalHeight;
    }

    private clampToOutsideSeriesRect(seriesRect: BBox, value: number, dimension: Dimension, direction: Direction) {
        const bound = dimension === 'x' ? seriesRect.x : seriesRect.y;
        const size = dimension === 'x' ? seriesRect.width : seriesRect.height;

        return direction === 1 ? Math.min(value, bound + size) : Math.max(value, bound);
    }

    private calculateAxisDimensions(opts: {
        axis: ChartAxis;
        seriesRect: BBox;
        primaryTickCounts: Partial<Record<ChartAxisDirection, number>>;
        clipSeries: boolean;
    }) {
        const { axis, seriesRect, primaryTickCounts } = opts;
        let { clipSeries } = opts;
        const { position = 'left', direction } = axis;

        this.sizeAxis(axis, seriesRect, position);

        const syncedDomain = this.getSyncedDomain(axis);
        const layout = axis.calculateLayout(syncedDomain, axis.nice ? primaryTickCounts[direction] : undefined);
        const isVertical = direction === ChartAxisDirection.Y;

        primaryTickCounts[direction] ??= layout.primaryTickCount;
        clipSeries ||= axis.dataDomain.clipped || axis.visibleRange[0] > 0 || axis.visibleRange[1] < 1;

        let axisThickness;
        if (axis.thickness != null && axis.thickness > 0) {
            axisThickness = axis.thickness;
        } else {
            axisThickness = isVertical ? layout.bbox.width : layout.bbox.height;
        }

        axisThickness = Math.ceil(axisThickness);

        return { clipSeries, axisThickness };
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

        let { min, max } = this.ctx.zoomManager.getAxisZoom(axis.id);
        const { width, height } = seriesRect;

        const minStart = 0;
        const maxEnd = isLeftRight ? height : width;
        let start = minStart;
        let end = maxEnd;

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

        if (isCategory && isLeftRight) {
            [min, max] = [1 - max, 1 - min];
        } else if (isLeftRight) {
            [start, end] = [end, start];
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

    getDefaultState(axes: ChartAxis[]) {
        const axisAreaWidths = new Map();

        if (this.lastAreaWidths) {
            // Clean any positions which aren't valid with the current axis status,
            // Otherwise we end up never being able to find a stable result.
            for (const { position } of axes) {
                if (position && this.lastAreaWidths.has(position)) {
                    axisAreaWidths.set(position, this.lastAreaWidths.get(position));
                }
            }
        }

        return { axisAreaWidths, clipSeries: false } as State;
    }

    isLayoutStable(newState: State, prevState: State) {
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
