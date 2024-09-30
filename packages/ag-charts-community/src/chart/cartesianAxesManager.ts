import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { BBox } from '../scene/bbox';
import { Logger } from '../util/logger';
import type { Padding } from '../util/padding';
import { CategoryAxis } from './axis/categoryAxis';
import { GroupedCategoryAxis } from './axis/groupedCategoryAxis';
import type { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';
import type { ChartContext } from './chartContext';

const directions: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];
type AreaWidthMap = Map<AgCartesianAxisPosition, number>;

export class CartesianAxesManager {
    private _lastCrossLineIds?: string[] = undefined;
    private _lastAxisAreaWidths: AreaWidthMap = new Map();
    private _lastClipSeries = false;
    private _lastVisibility = true;

    constructor(protected ctx: ChartContext) {}

    updateAxes(axes: ChartAxis[], layoutBox: BBox, seriesPadding: Padding, seriesRect?: BBox) {
        // FIXME - the crosslines get regenerated when switching between light/dark mode.
        // Ideally, even in this case this updateAxes logic would still work. But there's more work to make that happen.
        const crossLineIds = axes.flatMap((axis) => axis.crossLines ?? []).map((crossLine) => crossLine.id);
        const axesValid =
            this._lastCrossLineIds != null &&
            this._lastCrossLineIds.length === crossLineIds.length &&
            this._lastCrossLineIds.every((id, index) => crossLineIds[index] === id);

        let axisAreaWidths: AreaWidthMap;
        let clipSeries: boolean;
        let visibility: boolean;
        if (axesValid) {
            // Start with a good approximation from the last update - this should mean that in many resize
            // cases that only a single pass is needed \o/.
            axisAreaWidths = new Map(this._lastAxisAreaWidths.entries());
            clipSeries = this._lastClipSeries;
            visibility = this._lastVisibility;
        } else {
            axisAreaWidths = new Map();
            clipSeries = false;
            visibility = true;
            this._lastCrossLineIds = crossLineIds;
        }

        // Clean any positions which aren't valid with the current axis status (otherwise we end up
        // never being able to find a stable result).
        const liveAxisWidths = new Set(axes.map((a) => a.position));
        for (const position of axisAreaWidths.keys()) {
            if (!liveAxisWidths.has(position)) {
                axisAreaWidths.delete(position);
            }
        }

        const stableOutputs = <T extends typeof axisAreaWidths>(
            otherAxisWidths: T,
            otherClipSeries: boolean,
            otherVisibility: boolean
        ) => {
            // Check for new axis positions.
            for (const key of otherAxisWidths.keys()) {
                if (!axisAreaWidths.has(key)) {
                    return false;
                }
            }
            if (visibility !== otherVisibility || clipSeries !== otherClipSeries) {
                console.log(2);
                return false;
            }
            // Check for existing axis positions and equality.
            for (const [p, w] of axisAreaWidths.entries()) {
                const otherW = otherAxisWidths.get(p);
                if ((w != null || otherW != null) && w !== otherW) {
                    console.log(3);
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
        let lastPassVisibility: boolean | undefined;
        let lastPassClipSeries = false;
        let count = 0;
        do {
            axisAreaWidths = new Map(lastPassAxisAreaWidths.entries());
            clipSeries = lastPassClipSeries;
            if (lastPassVisibility != null) {
                visibility = lastPassVisibility;
            }

            const result = this.updateAxesPass(axes, axisAreaWidths, layoutBox.clone(), seriesPadding, seriesRect);
            lastPassAxisAreaWidths = ceilValues(result.axisAreaWidths);
            lastPassVisibility = result.visibility;
            lastPassClipSeries = result.clipSeries;
            ({ seriesRect } = result);

            if (count++ > 10) {
                Logger.warn('unable to find stable axis layout.');
                break;
            }
        } while (!stableOutputs(lastPassAxisAreaWidths, lastPassClipSeries, lastPassVisibility));

        for (const axis of axes) {
            axis.update();
        }

        axes.forEach((axis) => {
            // update visibility of crosslines
            axis.setCrossLinesVisible(visibility);

            if (!seriesRect) return;

            const gridLinePadding = Math.ceil((axis.gridLine?.width ?? 0) / 2);
            const axisLinePadding = Math.ceil(axis.line?.width ?? 0);

            axis.clipGrid(
                seriesRect.x,
                seriesRect.y,
                seriesRect.width + (axis.direction === ChartAxisDirection.X ? gridLinePadding : axisLinePadding),
                seriesRect.height + (axis.direction === ChartAxisDirection.Y ? gridLinePadding : axisLinePadding)
            );

            switch (axis.position) {
                case 'left':
                case 'right':
                    axis.clipTickLines(
                        layoutBox.x,
                        seriesRect.y,
                        layoutBox.width + gridLinePadding,
                        seriesRect.height + gridLinePadding
                    );
                    break;
                case 'top':
                case 'bottom':
                    axis.clipTickLines(
                        seriesRect.x,
                        layoutBox.y,
                        seriesRect.width + gridLinePadding,
                        layoutBox.height + gridLinePadding
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
        axes: ChartAxis[],
        axisAreaWidths: Map<AgCartesianAxisPosition, number>,
        bounds: BBox,
        seriesPadding: Padding,
        lastPassSeriesRect?: BBox
    ) {
        const axisWidths: Map<string, number> = new Map();
        const axisGroups: Map<AgCartesianAxisPosition, ChartAxis[]> = new Map();

        let clipSeries = false;
        const primaryTickCounts: Partial<Record<ChartAxisDirection, number>> = {};

        const paddedBounds = this.applySeriesPadding(axes, bounds.clone(), seriesPadding);
        const crossLinePadding = lastPassSeriesRect ? this.buildCrossLinePadding(axes, axisAreaWidths) : {};
        const { axisAreaBound, visible: visibility } = this.buildAxisBound(
            paddedBounds,
            axisAreaWidths,
            crossLinePadding
        );
        const seriesRect = this.buildSeriesRect(axisAreaBound, axisAreaWidths);

        // Step 1) Calculate individual axis widths.
        for (const axis of axes) {
            const { position = 'left' } = axis;

            const { clipSeries: newClipSeries, axisThickness } = this.calculateAxisDimensions({
                axis,
                seriesRect,
                primaryTickCounts,
                clipSeries,
            });
            axisWidths.set(axis.id, axisThickness);

            if (axisGroups.has(position)) {
                axisGroups.get(position)!.push(axis);
            } else {
                axisGroups.set(position, [axis]);
            }

            clipSeries ||= newClipSeries;
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

    private buildCrossLinePadding(axes: ChartAxis[], axisAreaSize: Map<AgCartesianAxisPosition, number>) {
        const crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>> = {};

        axes.forEach((axis) => {
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

    private applySeriesPadding(axes: ChartAxis[], paddedRect: BBox, seriesPadding: Padding) {
        for (const dir of directions) {
            const padding = seriesPadding[dir];
            const axis = axes.findLast((a) => a.position === dir);
            if (axis) {
                axis.seriesAreaPadding = padding;
            } else {
                paddedRect.shrink(padding, dir);
            }
        }
        return paddedRect;
    }

    private buildAxisBound(
        bounds: BBox,
        axisAreaWidths: Map<AgCartesianAxisPosition, number>,
        crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>>
    ) {
        const result = bounds.clone();
        const { top = 0, right = 0, bottom = 0, left = 0 } = crossLinePadding;
        const horizontalPadding = left + right;
        const verticalPadding = top + bottom;
        const totalWidth = (axisAreaWidths.get('left') ?? 0) + (axisAreaWidths.get('right') ?? 0) + horizontalPadding;
        const totalHeight = (axisAreaWidths.get('top') ?? 0) + (axisAreaWidths.get('bottom') ?? 0) + verticalPadding;
        if (result.width <= totalWidth || result.height <= totalHeight) {
            // Not enough space for main content
            return { axisAreaBound: result, visible: false };
        }

        result.x += left;
        result.y += top;
        result.width -= horizontalPadding;
        result.height -= verticalPadding;

        return { axisAreaBound: result, visible: true };
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

        const isVertical = direction === ChartAxisDirection.Y;

        const layout = axis.calculateLayout(axis.nice ? primaryTickCounts[direction] : undefined);
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

    // private shouldRecalculate(otherAxisWidths: AreaWidthMap, otherClipSeries: boolean, otherVisibility: boolean) {
    //     // Check for new axis positions.
    //     for (const key of otherAxisWidths.keys()) {
    //         if (!axisAreaWidths.has(key)) {
    //             return true;
    //         }
    //     }
    //     if (visibility !== otherVisibility || clipSeries !== otherClipSeries) {
    //         return true;
    //     }
    //     // Check for existing axis positions and equality.
    //     for (const [p, w] of axisAreaWidths.entries()) {
    //         const otherW = otherAxisWidths.get(p);
    //         if ((w != null || otherW != null) && w !== otherW) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }
}
