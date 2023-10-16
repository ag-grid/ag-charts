import type { AgSeriesType } from '../options/series/seriesOptions';
import type { BaseModule, ModuleInstance } from './baseModule';
import type { AxisContext, ModuleContextWithParent, SeriesContext } from './moduleContext';

export interface AxisOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'axis-option';
    axisTypes: ('category' | 'number' | 'log' | 'time')[];
    instanceConstructor: new (ctx: ModuleContextWithParent<AxisContext>) => M;
    themeTemplate: {};
}

export interface SeriesOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'series-option';
    seriesTypes: readonly AgSeriesType[];
    instanceConstructor: new (ctx: SeriesContext) => M;
    themeTemplate: {};
}
