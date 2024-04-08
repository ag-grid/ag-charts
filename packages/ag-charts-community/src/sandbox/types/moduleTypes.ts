import type { ChartType, IAxis, IModule, ISeries } from '../types';
import type { OptionsDefs } from '../util/validation';
import type { CartesianChartAxes, PolarChartAxes } from './axisTypes';

export type Module =
    | AxisModule<any>
    | SeriesModule<any>
    | OptionModule<any>
    | AxisOptionModule<any>
    | SeriesOptionModule<any>;

export type ModuleType = 'axis' | 'series' | 'axis-option' | 'chart-option' | 'series-option';

export interface ModuleDef<OptionsType extends object, ConstructorType extends IModule = IModule> {
    type: ModuleType;
    identifier: string;
    constructor: { createInstance: () => ConstructorType };
    optionsDefs: OptionsDefs<OptionsType>;

    chartTypes?: ChartType[];
    enterprise?: boolean;
    defaults?: Partial<OptionsType>;
}

export interface AxisModule<T extends object> extends ModuleDef<T, IAxis> {
    type: 'axis';
}

export interface SeriesModule<T extends object> extends ModuleDef<T, ISeries> {
    type: 'series';
    groupable?: boolean;
    stackable?: boolean;
    canSwapDirection?: boolean;
    paletteFactory?: (params: object) => { fill: string[]; stroke: string[] }; // TODO: improve

    dataDefs?: object;

    axesDefaults?: CartesianChartAxes[] | PolarChartAxes[];
}

export interface OptionModule<T extends object> extends ModuleDef<T> {
    type: 'chart-option';
}

export interface AxisOptionModule<T extends object> extends ModuleDef<T> {
    type: 'axis-option';
}

export interface SeriesOptionModule<T extends object> extends ModuleDef<T> {
    type: 'series-option';
}
