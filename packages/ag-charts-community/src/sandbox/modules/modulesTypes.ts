import type { OptionsDefs } from '../../util/validate';
import type { CartesianCoordinate, PolarCoordinate } from '../axes/axesEnums';
import type { CartesianChartAxes, IAxis, PolarChartAxes } from '../axes/axesTypes';
import type { ISeries } from '../series/seriesTypes';
import type { ChartType } from '../types/enums';

export interface IModule {}

export type Module =
    | AxisModule<any>
    | SeriesModule<any>
    | OptionModule<any>
    | AxisOptionModule<any>
    | SeriesOptionModule<any>;

export type ModuleType = 'axis' | 'series' | 'layout' | 'axis-option' | 'chart-option' | 'series-option';

export interface ModuleDef<OptionsType extends object, ConstructorType extends IModule = IModule> {
    type: ModuleType;
    identifier: string;
    constructor: { createInstance: () => ConstructorType };
    optionsDefs: Omit<OptionsDefs<OptionsType>, 'type'>;

    chartTypes?: ChartType[];
    enterprise?: boolean;
    defaults?: Partial<OptionsType>;
}

export interface AxisModule<T extends object> extends ModuleDef<T, IAxis> {
    type: 'axis';
}

export interface SeriesModule<T extends object> extends ModuleDef<T, ISeries> {
    type: 'series';
    chartTypes: [ChartType];

    groupable?: boolean;
    stackable?: boolean;
    canSwapDirection?: boolean;

    axesDefaults?: CartesianChartAxes[] | PolarChartAxes[];
    axesKeysMap?: Record<string, string[]>;

    paletteFactory?: (params: object) => { fill: string[]; stroke: string[] }; // TODO: improve
}

export interface CartesianSeriesModule<T extends object> extends SeriesModule<T> {
    chartTypes: [ChartType.Cartesian];
    axesKeysMap?: { [K in CartesianCoordinate]: string[] };
}

export interface PolarSeriesModule<T extends object> extends SeriesModule<T> {
    chartTypes: [ChartType.Polar];
    axesKeysMap?: { [K in PolarCoordinate]: string[] };
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