import {
    ChartAxisDirection,
    type Point,
    Property,
    type Scaling,
    clamp,
    extent,
    findMinMax,
    isFiniteNumber,
} from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import { ContinuousScale } from '../../../scale/continuousScale';
import { IrregularBandScale } from '../../../scale/irregularBandScale';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import type { ChartAxis } from '../../chartAxis';
import { fixNumericExtent } from '../../data/dataModel';
import type { SeriesNodePickMatch } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { type CartesianAnimationData, CartesianSeries, CartesianSeriesProperties } from './cartesianSeries';
import type {
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
    CartesianSeriesTypes,
    ContextOf,
    DatumOf,
    LabelOf,
    NodeOf,
} from './cartesianSeriesTypes';
import { type QuadtreeCompatibleNode, addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';

export abstract class AbstractBarSeriesProperties<T extends object> extends CartesianSeriesProperties<T> {
    @Property
    direction: Direction = 'vertical';

    @Property
    width?: number = undefined;

    @Property
    widthRatio?: number = undefined;

    @Property
    minWidth?: number = undefined;

    @Property
    maxWidth?: number = undefined;
}

export interface AbstractBarSeriesNodeDataContext<
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
> extends CartesianSeriesNodeDataContext<TDatum, TLabel> {
    groupScale: Scaling | undefined;
}

/**
 * Type constraint for series extending AbstractBarSeries.
 * The node type must be compatible with quadtree hit testing.
 * The properties type must include direction for bar orientation.
 */
export interface AbstractBarSeriesTypes extends CartesianSeriesTypes {
    readonly node: QuadtreeCompatibleNode;
    readonly properties: AbstractBarSeriesProperties<this['options']>;
    readonly context: AbstractBarSeriesNodeDataContext<this['datum'], this['label']>;
}

export type AbstractBarSeriesAnimationData<TTypes extends AbstractBarSeriesTypes> = CartesianAnimationData<
    NodeOf<TTypes>,
    DatumOf<TTypes>,
    LabelOf<TTypes>,
    ContextOf<TTypes>
>;

export abstract class AbstractBarSeries<TTypes extends AbstractBarSeriesTypes> extends CartesianSeries<TTypes> {
    protected smallestDataInterval?: number = undefined;
    protected largestDataInterval?: number = undefined;

    protected padBandExtent(keys: any[], alignStart?: boolean) {
        const ratio = typeof alignStart === 'boolean' ? 1 : 0.5;
        const scalePadding = isFiniteNumber(this.smallestDataInterval) ? this.smallestDataInterval * ratio : 0;
        const keysExtent = extent(keys) ?? [Number.NaN, Number.NaN];
        if (typeof alignStart === 'boolean') {
            keysExtent[alignStart ? 0 : 1] -= (alignStart ? 1 : -1) * scalePadding;
        } else {
            keysExtent[0] -= scalePadding;
            keysExtent[1] += scalePadding;
        }
        return fixNumericExtent(keysExtent);
    }

    override getBandScalePadding() {
        return { inner: 0.3, outer: 0.15 };
    }

    override shouldFlipXY(): boolean {
        return !this.isVertical();
    }

    protected isVertical(): boolean {
        return this.properties.direction === 'vertical';
    }

    protected getBarDirection() {
        return this.shouldFlipXY() ? ChartAxisDirection.X : ChartAxisDirection.Y;
    }

    protected getCategoryDirection() {
        return this.shouldFlipXY() ? ChartAxisDirection.Y : ChartAxisDirection.X;
    }

    protected getValueAxis(): ChartAxis | undefined {
        const direction = this.getBarDirection();
        return this.axes[direction];
    }

    protected getCategoryAxis(): ChartAxis | undefined {
        const direction = this.getCategoryDirection();
        return this.axes[direction];
    }

    override getMinimumRangeSeries(ranges: number[]) {
        const minWidth = this.properties.width ?? this.properties.minWidth;
        if (minWidth == null) return;

        const axis = this.getCategoryAxis();
        if (!axis) return;

        // Find the max width for each stack that shares the same index.
        const { index } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        ranges[index] = Math.max(ranges[index] ?? 0, minWidth);
    }

    override getMinimumRangeChart(ranges: number[]) {
        if (ranges.length === 0) return 0;

        const axis = this.getCategoryAxis();
        if (!(axis instanceof GroupedCategoryAxis || axis instanceof CategoryAxis)) return 0;

        const dataSize = this.data?.netSize() ?? 0;
        if (dataSize === 0) return 0;

        // TODO: this should come from the theme
        const defaultPadding = this.getBandScalePadding();
        const { paddingInner = defaultPadding.inner, paddingOuter = defaultPadding.outer, groupPaddingInner } = axis;

        // The width of each band is the sum of the max of each stack.
        const width = ranges.reduce((sum, range) => sum + range, 0);
        const averageWidth = width / ranges.length;

        const { visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);

        // The inverse calculations of the band scale to determine the expected chart width.
        const bandWidth = width + groupPaddingInner * averageWidth * (visibleGroupCount - 1);
        const paddingFactor = (dataSize - paddingInner + paddingOuter * 2) / (1 - paddingInner);

        return bandWidth * paddingFactor;
    }

    /**
     * Override to use bar-specific axis resolution (category/value vs X/Y).
     * Bar series can be horizontal or vertical, so we use getCategoryAxis/getValueAxis.
     */
    protected override validateCreateNodeDataPreconditions(): { xAxis: ChartAxis; yAxis: ChartAxis } | undefined {
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!xAxis || !yAxis || !this.dataModel || !this.processedData) {
            return undefined;
        }
        return { xAxis, yAxis };
    }

    protected getBandwidth(xAxis: ChartAxis, minWidth?: 1 | 0) {
        return ContinuousScale.is(xAxis.scale)
            ? xAxis.scale.calcBandwidth(this.smallestDataInterval, minWidth)
            : xAxis.scale.bandwidth ?? 0;
    }

    override xCoordinateRange(xValue: any): [number, number] {
        const xAxis = this.axes[this.getCategoryDirection()]!;
        const xScale = xAxis.scale;
        const bandWidth = this.getBandwidth(xAxis, 0);
        const barOffset = ContinuousScale.is(xScale) ? bandWidth * -0.5 : 0;
        const x = xScale.convert(xValue) + barOffset;
        return [x, x + bandWidth];
    }

    override yCoordinateRange(yValues: any[]): [number, number] {
        const yAxis = this.axes[this.getBarDirection()]!;
        const yScale = yAxis.scale;
        const ys = yValues.map((yValue) => yScale.convert(yValue));
        if (ys.length === 1) {
            const y0 = yScale.convert(0);
            return [Math.min(ys[0], y0), Math.max(ys[0], y0)];
        }
        return findMinMax(ys) as [number, number];
    }

    override getSeriesStateWidth() {
        return this.properties.width;
    }

    protected getBarDimensions() {
        const { minWidth, maxWidth } = this.properties;

        const categoryAxis = this.getCategoryAxis()!;
        const bandwidth = this.getBandwidth(categoryAxis);

        this.ctx.seriesStateManager.updateGroupScale(this, bandwidth, categoryAxis);

        const barWidth = clamp(minWidth ?? -Infinity, this.getBarWidth(), maxWidth ?? Infinity);
        const barOffset = this.getBarOffset(barWidth);
        let groupOffset = this.getGroupOffset();

        if (this.ctx.domManager.isRtl && this.seriesGrouping != null) {
            const groupBandWidth = this.ctx.seriesStateManager.getGroupBandWidth(this);
            groupOffset = bandwidth - groupOffset - groupBandWidth;
        }

        return { groupOffset, barOffset, barWidth };
    }

    /**
     * The offset for this series from the start of the group when grouped with other series.
     */
    private getGroupOffset() {
        return this.ctx.seriesStateManager.getGroupOffset(this);
    }

    /**
     * The offset for each bar in this series to centre it on the datum.
     */
    private getBarOffset(barWidth: number) {
        const { width, minWidth, maxWidth, widthRatio } = this.properties;

        const groupScale = this.ctx.seriesStateManager.getGroupScale(this);
        const xAxis = this.getCategoryAxis()!;

        let barOffset = 0;
        if (ContinuousScale.is(xAxis.scale)) {
            // For continuous scales, simply centre the bar on its own width.
            barOffset = -barWidth / 2;
        } else if (this.seriesGrouping == null && groupScale) {
            // For ungrouped series, centre the bar within the width of the group.
            const rangeWidth = this.getGroupScaleRangeWidth(groupScale);
            barOffset = (rangeWidth - barWidth) / 2;
        } else if (groupScale && (widthRatio != null || (width == null && (minWidth != null || maxWidth != null)))) {
            // For grouped series with fixed widths, centre the bar on its own width adjusted by the default width of
            // bars within the group.
            barOffset = (groupScale.bandwidth - barWidth) / 2;
        }

        // Apply a further offset if this series is stacked with another.
        const stackOffset = this.ctx.seriesStateManager.getStackOffset(this, barWidth);

        return barOffset + stackOffset;
    }

    private getBarWidth() {
        const { seriesGrouping } = this;
        const { width } = this.properties;
        let { widthRatio } = this.properties;

        const groupScale = this.ctx.seriesStateManager.getGroupScale(this);
        const bandwidth = groupScale?.bandwidth ?? 0;

        if (seriesGrouping == null) {
            widthRatio ??= 1;
        }

        if (widthRatio != null) {
            let relativeWidth = width;

            // Ungrouped bars with widthRatio but no fixed width use a percentage of the full width of the band.
            if (seriesGrouping == null && relativeWidth == null && groupScale) {
                relativeWidth = this.getGroupScaleRangeWidth(groupScale);
            }

            // For high-volume bar charts, ignore the widthRatio when applied against the bandwidth.
            if (relativeWidth == null && bandwidth < 1 && groupScale) {
                return groupScale.rawBandwidth;
            }

            // Grouped bars, or ungrouped with a fixed width, fallback to a percentage of the calculated bandwidth.
            return (relativeWidth ?? bandwidth) * widthRatio;
        }

        if (width != null) {
            return width;
        }

        // Handle high-volume bar charts gracefully.
        if (bandwidth < 1 && groupScale) {
            return groupScale.rawBandwidth;
        }

        // Pixel-rounded value for low-volume bar charts.
        return bandwidth;
    }

    private getGroupScaleRangeWidth(groupScale: IrregularBandScale) {
        let rangeWidth = groupScale.range[1] - groupScale.range[0];
        if (groupScale.round && rangeWidth > 0) rangeWidth = Math.floor(rangeWidth);
        return rangeWidth;
    }

    /**
     * The individual offset for each datum bar when skipping nullish bars. It shifts the bar an accumulated amount
     * left or right to reduce the space occupied by nullish bars before or after it, respectively.
     */
    protected getDatumOffset(datumIndex: number) {
        if (
            !this.processedData?.invalidData ||
            !this.processedData?.missingData ||
            !this.getCategoryAxis()?.skipNullBars
        ) {
            return 0;
        }

        const offset = this.ctx.seriesStateManager.getDatumOffset(
            this,
            this.processedData.invalidData,
            this.processedData.missingData,
            datumIndex
        );

        return this.ctx.domManager.isRtl ? -offset : offset;
    }

    override resolveKeyDirection(direction: ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<DatumOf<TTypes>>) {
        addHitTestersToQuadtree(quadtree, this.datumNodesIter());
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }
}
