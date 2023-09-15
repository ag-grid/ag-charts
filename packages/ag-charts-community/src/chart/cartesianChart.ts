import type { SpecialOverrides, TransferableResources } from './chart';
import { Chart } from './chart';
import { CategoryAxis } from './axis/categoryAxis';
import { GroupedCategoryAxis } from './axis/groupedCategoryAxis';
import type { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';
import type { BBox } from '../scene/bbox';
import type { AgCartesianAxisPosition } from '../options/agChartOptions';
import { Logger } from '../util/logger';
import { toRadians } from '../util/angle';

type VisibilityMap = { crossLines: boolean; series: boolean };
const directions: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];

export class CartesianChart extends Chart {
    static className = 'CartesianChart';
    static type = 'cartesian';

    /** Integrated Charts feature state - not used in Standalone Charts. */
    public readonly paired: boolean = true;

    constructor(specialOverrides: SpecialOverrides, resources?: TransferableResources) {
        super(specialOverrides, resources);
    }

    async performLayout() {
        const shrinkRect = await super.performLayout();

        const { seriesRect, visibility, clipSeries } = this.updateAxes(shrinkRect);
        this.seriesRoot.visible = visibility.series;
        this.seriesRect = seriesRect;
        this.seriesRoot.translationX = Math.floor(seriesRect.x);
        this.seriesRoot.translationY = Math.floor(seriesRect.y);

        const {
            seriesArea: { padding },
        } = this;

        // Recreate padding object to prevent issues with getters in `BBox.shrink()`
        const seriesPaddedRect = seriesRect.clone().grow({
            top: padding.top,
            right: padding.right,
            bottom: padding.bottom,
            left: padding.left,
        });

        this.hoverRect = seriesPaddedRect;

        this.layoutService.dispatchLayoutComplete({
            type: 'layout-complete',
            chart: { width: this.scene.width, height: this.scene.height },
            clipSeries,
            series: { rect: seriesRect, paddedRect: seriesPaddedRect, visible: visibility.series },
            axes: this.axes.map((axis) => ({ id: axis.id, ...axis.getLayoutState() })),
        });

        return shrinkRect;
    }

    private _lastAxisWidths: Partial<Record<AgCartesianAxisPosition, number>> = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    };
    private _lastVisibility: VisibilityMap = {
        crossLines: true,
        series: true,
    };
    updateAxes(inputShrinkRect: BBox) {
        // Start with a good approximation from the last update - this should mean that in many resize
        // cases that only a single pass is needed \o/.
        const axisWidths = { ...this._lastAxisWidths };
        const visibility = { ...this._lastVisibility };

        // Clean any positions which aren't valid with the current axis status (otherwise we end up
        // never being able to find a stable result).
        const liveAxisWidths = new Set(this._axes.map((a) => a.position));
        for (const position of Object.keys(axisWidths) as AgCartesianAxisPosition[]) {
            if (!liveAxisWidths.has(position)) {
                delete axisWidths[position];
            }
        }

        const stableOutputs = <T extends typeof axisWidths>(
            otherAxisWidths: T,
            otherVisibility: Partial<VisibilityMap>
        ) => {
            // Check for new axis positions.
            if (Object.keys(otherAxisWidths).some((k) => (axisWidths as any)[k] == null)) {
                return false;
            }
            return (
                visibility.crossLines === otherVisibility.crossLines &&
                visibility.series === otherVisibility.series &&
                // Check for existing axis positions and equality.
                Object.entries(axisWidths).every(([p, w]) => {
                    const otherW = (otherAxisWidths as any)[p];
                    if (w != null || otherW != null) {
                        return w === otherW;
                    }
                    return true;
                })
            );
        };
        const ceilValues = <T extends Record<string, number | undefined>>(records: T) => {
            return Object.entries(records).reduce((out, [key, value]) => {
                if (value && Math.abs(value) === Infinity) {
                    value = 0;
                }
                out[key] = value != null ? Math.ceil(value) : value;
                return out;
            }, {} as any);
        };

        // Iteratively try to resolve axis widths - since X axis width affects Y axis range,
        // and vice-versa, we need to iteratively try and find a fit for the axes and their
        // ticks/labels.
        let lastPassAxisWidths: typeof axisWidths = {};
        let lastPassVisibility: Partial<VisibilityMap> = {};
        let clipSeries = false;
        let seriesRect = this.seriesRect?.clone();
        let count = 0;
        do {
            Object.assign(axisWidths, lastPassAxisWidths);
            Object.assign(visibility, lastPassVisibility);

            const result = this.updateAxesPass(axisWidths, inputShrinkRect.clone(), seriesRect);
            lastPassAxisWidths = ceilValues(result.axisWidths);
            lastPassVisibility = result.visibility;
            clipSeries = result.clipSeries;
            seriesRect = result.seriesRect;

            if (count++ > 10) {
                Logger.warn('unable to find stable axis layout.');
                break;
            }
        } while (!stableOutputs(lastPassAxisWidths, lastPassVisibility));

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
                        inputShrinkRect.x,
                        seriesRect.y,
                        inputShrinkRect.width + clipRectPadding,
                        seriesRect.height + clipRectPadding
                    );
                    break;
                case 'top':
                case 'bottom':
                    axis.clipTickLines(
                        seriesRect.x,
                        inputShrinkRect.y,
                        seriesRect.width + clipRectPadding,
                        inputShrinkRect.height + clipRectPadding
                    );
                    break;
            }
        });

        this._lastAxisWidths = axisWidths;
        this._lastVisibility = visibility;

        return { seriesRect, visibility, clipSeries };
    }

    private updateAxesPass(
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>,
        bounds: BBox,
        lastPassSeriesRect?: BBox
    ) {
        const { axes } = this;
        const visited: Partial<Record<AgCartesianAxisPosition, number>> = {};
        const newAxisWidths: Partial<Record<AgCartesianAxisPosition, number>> = {};
        const visibility: Partial<VisibilityMap> = {
            series: true,
            crossLines: true,
        };

        let clipSeries = false;
        const primaryTickCounts: Partial<Record<ChartAxisDirection, number>> = {};

        const paddedBounds = this.applySeriesPadding(bounds);
        const crossLinePadding = lastPassSeriesRect ? this.buildCrossLinePadding(axisWidths) : {};
        const axisBound = this.buildAxisBound(paddedBounds, axisWidths, crossLinePadding, visibility);

        const seriesRect = this.buildSeriesRect(axisBound, axisWidths);

        // Set the number of ticks for continuous axes based on the available range
        // before updating the axis domain via `this.updateAxes()` as the tick count has an effect on the calculated `nice` domain extent
        axes.forEach((axis) => {
            const { position = 'left' } = axis;

            const {
                clipSeries: newClipSeries,
                axisThickness,
                axisOffset,
            } = this.calculateAxisDimensions({
                axis,
                seriesRect,
                paddedBounds,
                axisWidths,
                newAxisWidths,
                primaryTickCounts,
                clipSeries,
                addInterAxisPadding: (visited[position] ?? 0) > 0,
            });

            visited[position] = (visited[position] ?? 0) + 1;
            clipSeries = clipSeries || newClipSeries;

            this.positionAxis({
                axis,
                axisBound,
                axisOffset,
                axisThickness,
                axisWidths,
                primaryTickCounts,
                seriesRect,
            });
        });

        return { clipSeries, seriesRect, axisWidths: newAxisWidths, visibility };
    }

    private buildCrossLinePadding(axisWidths: Partial<Record<AgCartesianAxisPosition, number>>) {
        const crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>> = {};

        this.axes.forEach((axis) => {
            if (axis.crossLines) {
                axis.crossLines.forEach((crossLine) => {
                    crossLine.calculatePadding(crossLinePadding);
                });
            }
        });
        // Reduce cross-line padding to account for overlap with axes.
        for (const [side, padding = 0] of Object.entries(crossLinePadding) as [AgCartesianAxisPosition, number][]) {
            crossLinePadding[side] = Math.max(padding - (axisWidths[side] ?? 0), 0);
        }

        return crossLinePadding;
    }

    private applySeriesPadding(bounds: BBox) {
        const paddedRect = bounds.clone();
        const reversedAxes = this.axes.slice().reverse();
        directions.forEach((dir) => {
            const padding = this.seriesArea.padding[dir];
            const axis = reversedAxes.find((axis) => axis.position === dir);
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
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>,
        crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>>,
        visibility: Partial<VisibilityMap>
    ) {
        const result = bounds.clone();
        const { top = 0, right = 0, bottom = 0, left = 0 } = crossLinePadding;
        const horizontalPadding = left + right;
        const verticalPadding = top + bottom;
        const totalWidth = (axisWidths.left ?? 0) + (axisWidths.right ?? 0) + horizontalPadding;
        const totalHeight = (axisWidths.top ?? 0) + (axisWidths.bottom ?? 0) + verticalPadding;
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

    private buildSeriesRect(axisBound: BBox, axisWidths: Partial<Record<AgCartesianAxisPosition, number>>) {
        const result = axisBound.clone();
        const { top, bottom, left, right } = axisWidths;
        result.x += left ?? 0;
        result.y += top ?? 0;
        result.width -= (left ?? 0) + (right ?? 0);
        result.height -= (top ?? 0) + (bottom ?? 0);

        // Width and height should not be negative.
        result.width = Math.max(0, result.width);
        result.height = Math.max(0, result.height);

        return result;
    }

    private clampToOutsideSeriesRect(seriesRect: BBox, value: number, dimension: 'x' | 'y', direction: -1 | 1) {
        const { x, y, width, height } = seriesRect;
        const clampBounds = [x, y, x + width, y + height];
        const fn = direction === 1 ? Math.min : Math.max;
        const compareTo = clampBounds[(dimension === 'x' ? 0 : 1) + (direction === 1 ? 0 : 2)];

        return fn(value, compareTo);
    }

    private calculateAxisDimensions(opts: {
        axis: ChartAxis;
        seriesRect: BBox;
        paddedBounds: BBox;
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>;
        newAxisWidths: Partial<Record<AgCartesianAxisPosition, number>>;
        primaryTickCounts: Partial<Record<ChartAxisDirection, number>>;
        clipSeries: boolean;
        addInterAxisPadding: boolean;
    }) {
        const { axis, seriesRect, paddedBounds, axisWidths, newAxisWidths, primaryTickCounts, addInterAxisPadding } =
            opts;
        let { clipSeries } = opts;
        const { position = 'left', direction } = axis;

        const axisLeftRightRange = (axis: ChartAxis) => {
            if (axis instanceof CategoryAxis || axis instanceof GroupedCategoryAxis) {
                return [0, seriesRect.height];
            }
            return [seriesRect.height, 0];
        };

        const axisOffset = newAxisWidths[position] ?? 0;
        switch (position) {
            case 'top':
            case 'bottom':
                axis.range = [0, seriesRect.width];
                axis.gridLength = seriesRect.height;
                break;
            case 'right':
            case 'left':
                axis.range = axisLeftRightRange(axis);
                axis.gridLength = seriesRect.width;
                break;
        }

        const zoom = this.zoomManager.getAxisZoom(axis.id);
        const { min = 0, max = 1 } = zoom ?? {};
        axis.visibleRange = [min, max];

        const rangeClipped = axis.dataDomain.clipped || axis.visibleRange[0] > 0 || axis.visibleRange[1] < 1;
        clipSeries ||= rangeClipped;

        let primaryTickCount = axis.nice ? primaryTickCounts[direction] : undefined;
        const paddedBoundsCoefficient = 0.3;

        if (axis.thickness != null && axis.thickness > 0) {
            axis.maxThickness = axis.thickness;
        } else if (direction === ChartAxisDirection.Y) {
            axis.maxThickness = paddedBounds.width * paddedBoundsCoefficient;
        } else {
            axis.maxThickness = paddedBounds.height * paddedBoundsCoefficient;
        }

        primaryTickCount = axis.update(primaryTickCount);
        primaryTickCounts[direction] = primaryTickCounts[direction] ?? primaryTickCount;

        let axisThickness = 0;
        if (axis.thickness != null && axis.thickness > 0) {
            axisThickness = axis.thickness;
        } else {
            const bbox = axis.computeBBox();
            axisThickness = direction === ChartAxisDirection.X ? bbox.height : bbox.width;
        }

        // for multiple axes in the same direction and position, apply padding at the top of each inner axis (i.e. between axes).
        const axisPadding = 15;
        if (addInterAxisPadding) {
            axisThickness += axisPadding;
        }
        axisThickness = Math.ceil(axisThickness);
        newAxisWidths[position] = (newAxisWidths[position] ?? 0) + axisThickness;

        axis.gridPadding = (axisWidths[position] ?? 0) - (newAxisWidths[position] ?? 0);

        return { clipSeries, axisThickness, axisOffset };
    }

    private positionAxis(opts: {
        axis: ChartAxis;
        axisBound: BBox;
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>;
        primaryTickCounts: Partial<Record<ChartAxisDirection, number>>;
        seriesRect: BBox;
        axisOffset: number;
        axisThickness: number;
    }) {
        const { axis, axisBound, axisWidths, seriesRect, axisOffset, axisThickness } = opts;
        const { position } = axis;

        switch (position) {
            case 'top':
                axis.translation.x = axisBound.x + (axisWidths.left ?? 0);
                axis.translation.y = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.y + 1 + axisOffset + axisThickness,
                    'y',
                    1
                );
                break;
            case 'bottom':
                axis.translation.x = axisBound.x + (axisWidths.left ?? 0);
                axis.translation.y = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.y + axisBound.height + 1 - axisThickness - axisOffset,
                    'y',
                    -1
                );
                break;
            case 'left':
                axis.translation.y = axisBound.y + (axisWidths.top ?? 0);
                axis.translation.x = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.x + axisOffset + axisThickness,
                    'x',
                    1
                );
                break;
            case 'right':
                axis.translation.y = axisBound.y + (axisWidths.top ?? 0);
                axis.translation.x = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.x + axisBound.width - axisThickness - axisOffset,
                    'x',
                    -1
                );
                break;
        }

        axis.updatePosition({ rotation: toRadians(axis.rotation), sideFlag: axis.label.getSideFlag() });
    }
}
