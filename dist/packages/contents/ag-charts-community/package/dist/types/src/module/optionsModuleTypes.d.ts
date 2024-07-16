import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { PropertyDefinition } from '../chart/data/dataModel';
import type { SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { AgCartesianSeriesOptions } from '../options/series/cartesian/cartesianSeriesTypes';
import type { AgHierarchySeriesOptions } from '../options/series/hierarchy/hierarchyOptions';
import type { AgPolarSeriesOptions } from '../options/series/polar/polarOptions';
import type { AgTopologySeriesOptions } from '../options/series/topology/topologyOptions';
import type { ScaleType } from '../scale/scale';
import type { Point } from '../scene/point';
import type { BaseModule, ModuleInstance } from './baseModule';
import type { SeriesContext } from './moduleContext';
export type PickNodeDatumResult = {
    datum: SeriesNodeDatum;
    distanceSquared: number;
} | undefined;
export type SeriesType = NonNullable<AgCartesianSeriesOptions['type'] | AgPolarSeriesOptions['type'] | AgHierarchySeriesOptions['type'] | AgTopologySeriesOptions['type']>;
export interface SeriesOptionInstance extends ModuleInstance {
    pickNodeExact(point: Point): PickNodeDatumResult;
    pickNodeNearest(point: Point): PickNodeDatumResult;
    pickNodeMainAxisFirst(point: Point): PickNodeDatumResult;
    getPropertyDefinitions(opts: {
        isContinuousX: boolean;
        isContinuousY: boolean;
        xScaleType?: ScaleType;
        yScaleType?: ScaleType;
    }): PropertyDefinition<unknown>[];
    getDomain(direction: ChartAxisDirection): any[];
    getTooltipParams(): object;
}
export interface SeriesOptionModule<M extends SeriesOptionInstance = SeriesOptionInstance> extends BaseModule {
    type: 'series-option';
    seriesTypes: readonly SeriesType[];
    instanceConstructor: new (ctx: SeriesContext) => M;
    themeTemplate: {};
}
