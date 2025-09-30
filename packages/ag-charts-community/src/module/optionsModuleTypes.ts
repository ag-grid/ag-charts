import type { Point } from 'ag-charts-core';
import type { SeriesType } from 'ag-charts-types';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { PropertyDefinition } from '../chart/data/dataModel';
import type { DatumIndexType, SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { ScaleType } from '../scale/scale';
import type { BaseOptionsModule, ModuleInstance } from './baseModule';
import type { SeriesContext } from './moduleContext';

export type PickNodeDatumResult = { datum: SeriesNodeDatum<DatumIndexType>; distanceSquared: number } | undefined;

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
