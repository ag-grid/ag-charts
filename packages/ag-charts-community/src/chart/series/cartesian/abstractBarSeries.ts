import { type Point, extent, isFiniteNumber } from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import { CategoryScale } from '../../../scale/categoryScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { Property } from '../../../util/properties';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { fixNumericExtent } from '../../data/dataModel';
import type { SeriesNodePickMatch } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import type {
    CartesianAnimationData,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
} from './cartesianSeries';
import { CartesianSeries, CartesianSeriesProperties } from './cartesianSeries';
import { type QuadtreeCompatibleNode, addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';
import type { Scaling } from './scaling';

export abstract class AbstractBarSeriesProperties<T extends object> extends CartesianSeriesProperties<T> {
    @Property
    direction: Direction = 'vertical';
}

export interface AbstractBarSeriesNodeDataContext<
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
> extends CartesianSeriesNodeDataContext<TDatum, TLabel> {
    groupScale: Scaling | undefined;
}

export type AbstractBarSeriesAnimationData<
    TNode extends QuadtreeCompatibleNode,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
> = CartesianAnimationData<TNode, TDatum, TLabel, AbstractBarSeriesNodeDataContext<TDatum, TLabel>>;

export abstract class AbstractBarSeries<
    TNode extends QuadtreeCompatibleNode,
    TOpts extends object,
    TProps extends AbstractBarSeriesProperties<TOpts>,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
    TContext extends AbstractBarSeriesNodeDataContext<TDatum, TLabel> = AbstractBarSeriesNodeDataContext<
        TDatum,
        TLabel
    >,
> extends CartesianSeries<TNode, TOpts, TProps, TDatum, TLabel, TContext> {
    /**
     * Used to get the position of bars within each group.
     */
    protected groupScale = new CategoryScale<string>();

    protected smallestDataInterval?: number = undefined;
    protected largestDataInterval?: number = undefined;

    override get hasData(): boolean {
        return this.getHasData('xValue');
    }

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

    protected updateGroupScale(xAxis: ChartAxis) {
        const domain = [];
        const { groupScale } = this;
        const xBandWidth = this.getBandwidth(xAxis);
        const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);

        for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
            domain.push(String(groupIdx));
        }
        groupScale.domain = domain;
        groupScale.range = [0, xBandWidth ?? 0];

        if (xAxis instanceof GroupedCategoryAxis) {
            groupScale.paddingInner = xAxis.groupPaddingInner;
        } else if (xAxis instanceof CategoryAxis) {
            groupScale.paddingInner = xAxis.groupPaddingInner;
            // To get exactly `0` padding we need to turn off rounding
            groupScale.round = groupScale.padding !== 0;
        } else {
            // Number or Time axis
            groupScale.padding = 0;
        }

        const barWidth =
            groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume bar charts.
                  groupScale.bandwidth
                : // Handle high-volume bar charts gracefully.
                  groupScale.rawBandwidth;

        return { barWidth, groupIndex };
    }

    protected override resolveKeyDirection(direction: ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<TDatum>) {
        addHitTestersToQuadtree(quadtree, this.datumNodesIter());
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }
}
