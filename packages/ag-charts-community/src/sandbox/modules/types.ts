import type { ChartType, IAxis, IModule, ISeries } from '../chart/types';
import type { OptionsDefs } from '../util/validation';

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
    constructor: ConstructorType;

    chartTypes?: ChartType[];
    enterprise?: boolean;

    defaults?: Partial<OptionsType>;
    optionsDefs: OptionsDefs<OptionsType>;
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
}

export interface OptionModule<T extends object> extends ModuleDef<T> {
    type: 'chart-option';
    constructor: IModule;
}

export interface AxisOptionModule<T extends object> extends ModuleDef<T> {
    type: 'axis-option';
    constructor: IModule;
}

export interface SeriesOptionModule<T extends object> extends ModuleDef<T> {
    type: 'series-option';
    constructor: IModule;
}
