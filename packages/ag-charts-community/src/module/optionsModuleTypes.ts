import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { PropertyDefinition } from '../chart/data/dataModel';
import type { SeriesType } from '../chart/mapping/types';
import type { SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { ScaleType } from '../scale/scale';
import type { Point } from '../scene/point';
import type { BaseOptionsModule, ModuleInstance } from './baseModule';
import type { SeriesContext } from './moduleContext';

export type PickNodeDatumResult = { datum: SeriesNodeDatum<unknown, unknown>; distanceSquared: number } | undefined;

export interface SeriesOptionInstance extends ModuleInstance {
    pickNodeExact(point: Point): PickNodeDatumResult;
    pickNodeNearest(point: Point): PickNodeDatumResult;
    pickNodeMainAxisFirst(point: Point, majorDirection: ChartAxisDirection): PickNodeDatumResult | undefined;

    getPropertyDefinitions(opts: {
        isContinuousX: boolean;
        isContinuousY: boolean;
        xScaleType?: ScaleType;
        yScaleType?: ScaleType;
    }): PropertyDefinition<unknown>[];
    getDomain(direction: ChartAxisDirection): any[];
    getTooltipParams(): object;
}

export interface SeriesOptionModule<M extends SeriesOptionInstance = SeriesOptionInstance> extends BaseOptionsModule {
    type: 'series-option';
    seriesTypes: readonly SeriesType[];
    moduleFactory: (ctx: SeriesContext) => M;
    themeTemplate: object;
}
