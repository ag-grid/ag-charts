import type { Scaling } from 'ag-charts-core';
import { ChartAxisDirection, type Point, Property, extent, isFiniteNumber } from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import { ContinuousScale } from '../../../scale/continuousScale';
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
        const { width } = this.properties;
        if (width == null) return;

        const axis = this.getCategoryAxis();
        if (!axis) return;

        // Find the max width for each stack that shares the same index.
        const { index } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        ranges[index] = Math.max(ranges[index] ?? 0, width);
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
            : xAxis.scale.bandwidth;
    }

    override xCoordinateRange(xValue: any): [number, number] {
        const xAxis = this.axes[this.getCategoryDirection()]!;
        const xScale = xAxis.scale;
        const bandWidth = this.getBandwidth(xAxis, 0) ?? 0;
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
        return [Math.min(...ys), Math.max(...ys)];
    }

    protected getBarDimensions() {
        const categoryAxis = this.getCategoryAxis()!;
        const bandwidth = this.getBandwidth(categoryAxis) ?? 0;

        this.ctx.seriesStateManager.updateGroupScale(this, bandwidth, categoryAxis);

        const groupOffset = this.getGroupOffset();
        const barWidth = this.getBarWidth();
        const barOffset = this.getBarOffset(barWidth);

        return { groupOffset, barOffset, barWidth };
    }

    private getGroupOffset() {
        return this.ctx.seriesStateManager.getGroupOffset(this);
    }

    private getBarOffset(barWidth: number) {
        const groupScale = this.ctx.seriesStateManager.getGroupScale(this);
        const xAxis = this.getCategoryAxis()!;

        let barOffset = 0;
        if (ContinuousScale.is(xAxis.scale)) {
            barOffset = -barWidth / 2;
        } else if (this.seriesGrouping == null && groupScale) {
            let relativeWidth = groupScale.range[1] - groupScale.range[0];
            if (groupScale.round && relativeWidth > 0) relativeWidth = Math.round(relativeWidth);
            barOffset = (relativeWidth - barWidth) / 2;
        }

        const stackOffset = this.ctx.seriesStateManager.getStackOffset(this, barWidth);

        return barOffset + stackOffset;
    }

    private getBarWidth() {
        const { width, widthRatio } = this.properties;

        const groupScale = this.ctx.seriesStateManager.getGroupScale(this);
        const bandwidth = groupScale?.bandwidth ?? 0;

        if (widthRatio != null) {
            let relativeWidth = width;
            if (relativeWidth == null && groupScale) {
                relativeWidth = groupScale.range[1] - groupScale.range[0];
                if (groupScale.round && relativeWidth > 0) relativeWidth = Math.round(relativeWidth);
            }
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
