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

type VisibilityMap = { crossLines: boolean; series: boolean };
const directions: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];

interface SyncModule extends ModuleInstance {
    enabled?: boolean;
    getSyncedDomain(axis: ChartAxis): any[] | undefined;
    updateSiblings(): void;
}

export class CartesianChart extends Chart {
    static readonly className = 'CartesianChart';
    static readonly type = 'cartesian';

    /** Integrated Charts feature state - not used in Standalone Charts. */
    public readonly paired: boolean = true;

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
        const { seriesRect, visibility, clipSeries } = this.updateAxes(ctx.layoutBox);

        this.seriesRoot.visible = visibility.series;
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
                rect: seriesRect,
                paddedRect: seriesPaddedRect,
                visible: visibility.series,
                shouldFlipXY: this.shouldFlipXY(),
            },
            clipSeries,
        });
    }

    private _lastCrossLineIds?: string[] = undefined;
    private _lastAxisAreaWidths: Map<AgCartesianAxisPosition, number> = new Map();
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

        const ceilValues = <K extends string>(map: Map<K, number>) => {
            for (const [key, value] of map.entries()) {
                if (value && Math.abs(value) === Infinity) {
                    map.set(key, 0);
                    continue;
                }
                map.set(key, value != null ? Math.ceil(value) : value);
            }
            return map;
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
            lastPassAxisAreaWidths = ceilValues(result.axisAreaWidths);
            lastPassVisibility = result.visibility;
            lastPassClipSeries = result.clipSeries;
            ({ seriesRect } = result);

            if (count++ > 10) {
                Logger.warn('unable to find stable axis layout.');
                break;
            }
        } while (!stableOutputs(lastPassAxisAreaWidths, lastPassClipSeries, lastPassVisibility));

        this.axes.forEach((axis) => {
            axis.update();
        });

        const clipRectPadding = 5;
        this.axes.forEach((axis) => {
            // update visibility of crosslines
            axis.setCrossLinesVisible(visibility.crossLines);

            if (!seriesRect) {
                return;
            }

            axis.clipGrid(
                seriesRect.x,
                seriesRect.y,
                seriesRect.width + clipRectPadding,
                seriesRect.height + clipRectPadding
            );

            switch (axis.position) {
                case 'left':
                case 'right':
                    axis.clipTickLines(
                        layoutBox.x,
                        seriesRect.y,
                        layoutBox.width + clipRectPadding,
                        seriesRect.height + clipRectPadding
                    );
                    break;
                case 'top':
                case 'bottom':
                    axis.clipTickLines(
                        seriesRect.x,
                        layoutBox.y,
                        seriesRect.width + clipRectPadding,
                        layoutBox.height + clipRectPadding
                    );
                    break;
            }
        });

        this._lastAxisAreaWidths = axisAreaWidths;
        this._lastVisibility = visibility;
        this._lastClipSeries = clipSeries;

        return { seriesRect, visibility, clipSeries };
    }

    private updateAxesPass(
        axisAreaWidths: Map<AgCartesianAxisPosition, number>,
        bounds: BBox,
        lastPassSeriesRect?: BBox
    ) {
        const axisWidths: Map<string, number> = new Map();
        const axisGroups: Map<AgCartesianAxisPosition, ChartAxis[]> = new Map();
        const visibility: Partial<VisibilityMap> = {
            series: true,
            crossLines: true,
        };

        let clipSeries = false;
        const primaryTickCounts: Partial<Record<ChartAxisDirection, number>> = {};

        const paddedBounds = this.applySeriesPadding(bounds);
        const crossLinePadding = lastPassSeriesRect ? this.buildCrossLinePadding(axisAreaWidths) : {};
        const axisAreaBound = this.buildAxisBound(paddedBounds, axisAreaWidths, crossLinePadding, visibility);
        const seriesRect = this.buildSeriesRect(axisAreaBound, axisAreaWidths);

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
        const newAxisAreaWidths = new Map<AgCartesianAxisPosition, number>();
        const axisOffsets = new Map<string, number>();
        for (const [position, axes] of axisGroups.entries()) {
            const isVertical = position === 'left' || position === 'right';
            newAxisAreaWidths.set(position, this.calculateAxisArea(axes, axisWidths, axisOffsets, isVertical));
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

    private buildCrossLinePadding(axisAreaSize: Map<AgCartesianAxisPosition, number>) {
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
        const paddedRect = bounds.clone();
        directions.forEach((dir) => {
            const padding = this.seriesArea.padding[dir];
            const axis = this.axes.findLast((a) => a.position === dir);
            if (axis) {
                axis.seriesAreaPadding = padding;
            } else {
                paddedRect.shrink(padding, dir);
            }
        });
        return paddedRect;
    }

    private buildAxisBound(
        bounds: BBox,
        axisAreaWidths: Map<AgCartesianAxisPosition, number>,
        crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>>,
        visibility: Partial<VisibilityMap>
    ) {
        const result = bounds.clone();
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

    private buildSeriesRect(axisBound: BBox, axisAreaWidths: Map<AgCartesianAxisPosition, number>) {
        const result = axisBound.clone();
        result.x += axisAreaWidths.get('left') ?? 0;
        result.y += axisAreaWidths.get('top') ?? 0;
        result.width -= (axisAreaWidths.get('left') ?? 0) + (axisAreaWidths.get('right') ?? 0);
        result.height -= (axisAreaWidths.get('top') ?? 0) + (axisAreaWidths.get('bottom') ?? 0);

        // Width and height should not be negative.
        result.width = Math.max(0, result.width);
        result.height = Math.max(0, result.height);

        return result;
    }

    private clampToOutsideSeriesRect(seriesRect: BBox, value: number, dimension: 'x' | 'y', direction: -1 | 1) {
        const { x, y, width, height } = seriesRect;
        const clampBounds = [x, y, x + width, y + height];
        const compareTo = clampBounds[(dimension === 'x' ? 0 : 1) + (direction === 1 ? 0 : 2)];
        const clampFn = direction === 1 ? Math.min : Math.max;

        return clampFn(value, compareTo);
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

    private calculateAxisArea(
        axes: ChartAxis[],
        axisWidths: Map<string, number>,
        axisOffsets: Map<string, number>,
        isVertical: boolean
    ) {
        const { width, height, canvas } = this.ctx.scene;
        // Adjust offset for pixel ratio to prevent alignment issues with series rendering.
        let currentOffset = isVertical ? height % canvas.pixelRatio : width % canvas.pixelRatio;
        let totalAxisWidth = 0;

        for (const axis of axes) {
            axisOffsets.set(axis.id, currentOffset);

            const axisThickness = axisWidths.get(axis.id) ?? 0;
            totalAxisWidth = Math.max(totalAxisWidth, currentOffset + axisThickness);
            if (axis.layoutConstraints.stacked) {
                // for multiple axes in the same direction and position, apply padding at the top of each inner axis (i.e. between axes).
                currentOffset += axisThickness + 15;
            }
        }

        return totalAxisWidth;
    }

    private positionAxes(opts: {
        axes: ChartAxis[];
        position: AgCartesianAxisPosition;
        axisBound: BBox;
        axisWidths: Map<string, number>;
        axisOffsets: Map<string, number>;
        axisAreaWidths: Map<AgCartesianAxisPosition, number>;
        seriesRect: BBox;
    }) {
        const { axes, axisBound, axisWidths, axisOffsets, axisAreaWidths, seriesRect, position } = opts;
        const axisAreaWidth = axisAreaWidths.get(position) ?? 0;

        let mainDimension: 'x' | 'y' = 'x';
        let minorDimension: 'x' | 'y' = 'y';
        let direction: -1 | 1 = 1;
        let axisBoundMainOffset = 0;
        if (position === 'top' || position === 'bottom') {
            mainDimension = 'y';
            minorDimension = 'x';
            axisBoundMainOffset += 1; // TODO: Not sure we need this extra 1px!
        }

        axisBoundMainOffset += axisBound[mainDimension];
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
}
