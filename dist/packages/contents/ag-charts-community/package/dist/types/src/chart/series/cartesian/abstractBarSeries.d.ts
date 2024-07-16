import type { Direction } from '../../../options/chart/types';
import { BandScale } from '../../../scale/bandScale';
import type { Point } from '../../../scene/point';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { SeriesNodePickMatch } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesProperties } from './cartesianSeries';
import { QuadtreeCompatibleNode } from './quadtreeUtil';
export declare abstract class AbstractBarSeriesProperties<T extends object> extends CartesianSeriesProperties<T> {
    direction: Direction;
}
export declare abstract class AbstractBarSeries<TNode extends QuadtreeCompatibleNode, TProps extends AbstractBarSeriesProperties<any>, TDatum extends CartesianSeriesNodeDatum, TLabel extends SeriesNodeDatum = TDatum, TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>> extends CartesianSeries<TNode, TProps, TDatum, TLabel, TContext> {
    /**
     * Used to get the position of bars within each group.
     */
    protected groupScale: BandScale<string, number>;
    protected smallestDataInterval?: number;
    getBandScalePadding(): {
        inner: number;
        outer: number;
    };
    shouldFlipXY(): boolean;
    protected isVertical(): boolean;
    protected getBarDirection(): ChartAxisDirection;
    protected getCategoryDirection(): ChartAxisDirection;
    protected getValueAxis(): ChartAxis | undefined;
    protected getCategoryAxis(): ChartAxis | undefined;
    protected updateGroupScale(xAxis: ChartAxis): {
        barWidth: number;
        groupIndex: number;
    };
    protected resolveKeyDirection(direction: ChartAxisDirection): ChartAxisDirection;
    protected initQuadTree(quadtree: QuadtreeNearest<TDatum>): void;
    protected pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined;
}
