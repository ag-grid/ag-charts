import type { Direction } from 'ag-charts-types';

import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { Point } from '../../../scene/point';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { DIRECTION, Validate } from '../../../util/validation';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { SeriesNodePickMatch } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesProperties } from './cartesianSeries';
import { type QuadtreeCompatibleNode, addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';

export abstract class AbstractBarSeriesProperties<T extends object> extends CartesianSeriesProperties<T> {
    @Validate(DIRECTION)
    direction: Direction = 'vertical';
}

export abstract class AbstractBarSeries<
    TNode extends QuadtreeCompatibleNode,
    TProps extends AbstractBarSeriesProperties<any>,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
> extends CartesianSeries<TNode, TProps, TDatum, TLabel, TContext> {
    /**
     * Used to get the position of bars within each group.
     */
    protected groupScale = new BandScale<string>();

    protected smallestDataInterval?: number = undefined;
    protected largestDataInterval?: number = undefined;

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

    protected updateGroupScale(xAxis: ChartAxis) {
        const {
            groupScale,
            smallestDataInterval,
            ctx: { seriesStateManager },
        } = this;

        const xScale = xAxis.scale;

        const xBandWidth = ContinuousScale.is(xScale) ? xScale.calcBandwidth(smallestDataInterval) : xScale.bandwidth;

        const domain = [];
        const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
        for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
            domain.push(String(groupIdx));
        }
        groupScale.domain = domain;
        groupScale.range = [0, xBandWidth ?? 0];

        if (xAxis instanceof CategoryAxis) {
            groupScale.paddingInner = xAxis.groupPaddingInner;
        } else if (xAxis instanceof GroupedCategoryAxis) {
            groupScale.padding = 0.1;
        } else {
            // Number or Time axis
            groupScale.padding = 0;
        }

        // To get exactly `0` padding we need to turn off rounding
        groupScale.round = groupScale.padding !== 0;

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
