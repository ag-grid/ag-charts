import {
    ChartAxisDirection,
    type Point,
    Property,
    type Scaling,
    addValues,
    extent,
    findMinMax,
    isFiniteNumber,
    subtractValues,
} from 'ag-charts-core';
import type { AgNumericValue, Direction } from 'ag-charts-types';

import { BandScale } from '../../../scale/bandScale';
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
}

export interface AbstractBarSeriesNodeDataContext<
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum = TDatum,
> extends CartesianSeriesNodeDataContext<TDatum, TLabel> {
    groupScale: Scaling | undefined;
}

/**
 * Type constraint for series extending AbstractBarSeries.
 * The node type must be compatible with quadtree hit testing.
 * The properties type must include direction for bar orientation.
 */
export interface AbstractBarSeriesTypes extends CartesianSeriesTypes {
    readonly node: QuadtreeCompatibleNode<this['datum']>;
    readonly properties: AbstractBarSeriesProperties<this['options']>;
    readonly context: AbstractBarSeriesNodeDataContext<this['datum'], this['label']>;
}

export type AbstractBarSeriesAnimationData<TTypes extends AbstractBarSeriesTypes> = CartesianAnimationData<
    DatumOf<TTypes>,
    NodeOf<TTypes>,
    LabelOf<TTypes>,
    ContextOf<TTypes>
>;

export abstract class AbstractBarSeries<TTypes extends AbstractBarSeriesTypes> extends CartesianSeries<TTypes> {
    protected smallestDataInterval?: AgNumericValue = undefined;
    protected largestDataInterval?: AgNumericValue = undefined;

    protected padBandExtent(keys: any[], alignStart?: boolean) {
        const ratio = typeof alignStart === 'boolean' ? 1 : 0.5;
        // Band positioning is finite-precision, so narrow the interval here before the padding arithmetic.
        const interval = this.smallestDataInterval == null ? Number.NaN : Number(this.smallestDataInterval);
        const scalePadding = isFiniteNumber(interval) ? interval * ratio : 0;
        const rawExtent = extent(keys);
        if (rawExtent == null) return fixNumericExtent([Number.NaN, Number.NaN]);
        // Keep endpoints exact so a bigint key axis positions at full precision; only the padding is narrowed.
        const keysExtent: AgNumericValue[] = [rawExtent[0], rawExtent[1]];
        if (typeof alignStart === 'boolean') {
            const i = alignStart ? 0 : 1;
            keysExtent[i] = subtractValues(keysExtent[i], (alignStart ? 1 : -1) * scalePadding);
        } else {
            keysExtent[0] = subtractValues(keysExtent[0], scalePadding);
            keysExtent[1] = addValues(keysExtent[1], scalePadding);
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

    /**
     * The dimension along which bars should be snapped centre-preservingly to the device grid, or
     * `undefined` to keep the default independent edge snap. Only band (category) scales get the
     * centre-preserving snap: there a bar's centre must coincide with its axis tick/gridline. On a
     * continuous scale (number/time) the edge snap is retained so sub-pixel width jitter — e.g. the
     * float noise from very large magnitudes (AG-16608) — cannot flip a bar's parity between renders.
     */
    protected getCategoryCrispDirection(): 'x' | 'y' | undefined {
        if (!BandScale.is(this.getCategoryAxis()?.scale)) return undefined;
        return this.getCategoryDirection() === ChartAxisDirection.X ? 'x' : 'y';
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
        const {
            paddingInner = defaultPadding.inner,
            paddingOuter = defaultPadding.outer,
            groupPaddingInner,
        } = axis.options;

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
            : (xAxis.scale.bandwidth ?? 0);
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

    protected getBarDimensions() {
        const categoryAxis = this.getCategoryAxis()!;
        const bandwidth = this.getBandwidth(categoryAxis);

        this.ctx.seriesStateManager.updateGroupScale(this, bandwidth, categoryAxis);

        const barWidth = this.getBarWidth();
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
        } else if (groupScale && this.properties.widthRatio != null) {
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
        return groupScale.range[1] - groupScale.range[0];
    }

    /**
     * The individual offset for each datum bar when skipping nullish bars. It shifts the bar an accumulated amount
     * left or right to reduce the space occupied by categories a series does not draw before or after it, respectively.
     * The offset is keyed on the category value, so it closes gaps whether a bar is null/missing in a shared data
     * array or the category is absent from a per-series `data` array.
     */
    protected getDatumOffset(datumKey: unknown) {
        const categoryAxis = this.getCategoryAxis();
        if (!(categoryAxis instanceof CategoryAxis && categoryAxis.options.skipNullBars)) {
            return 0;
        }

        const offset = this.ctx.seriesStateManager.getDatumOffset(this, datumKey);

        return this.ctx.domManager.isRtl ? -offset : offset;
    }

    /**
     * Records the category keys at which this series draws a bar, so that `skipNullBars` can close the gaps left by the
     * categories it omits. Must run before any series in the group creates node data, so it is driven from `processData`
     * (which completes for every series before node-data creation) rather than lazily during the offset calculation.
     */
    protected updateDatumValidKeys() {
        const { dataModel, processedData } = this;
        const categoryAxis = this.getCategoryAxis();

        if (
            !dataModel ||
            !processedData ||
            !(categoryAxis instanceof CategoryAxis && categoryAxis.options.skipNullBars)
        ) {
            this.ctx.seriesStateManager.setSeriesDatumValidKeys(this.internalId, undefined);
            return;
        }

        const keys = dataModel.resolveKeysById<unknown>(this, 'xValue', processedData);
        const invalidData = processedData.invalidData?.get(this.id);
        const missingData = processedData.missingData?.get(this.id);

        const validKeys: unknown[] = [];
        for (let i = 0; i < keys.length; i += 1) {
            if (invalidData?.[i] === true || missingData?.[i] === true) continue;
            validKeys.push(keys[i]);
        }

        this.ctx.seriesStateManager.setSeriesDatumValidKeys(this.internalId, validKeys);
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
