type BuiltInThemeType = 'default' | 'material' | 'polychroma' | 'sheets' | 'vivid';

export type ValidValue = boolean | number | string | ValidValue[];
export type ThemeVars<T extends string> = { [K in T]?: ValidValue };
export type ThemeName = `ag-${BuiltInThemeType}` | `ag-${BuiltInThemeType}-dark`;

export interface IThemeDefinition<T extends string> {
    readonly themeName: string;
    readonly baseTheme?: string;
    readonly themeDefaults: object;
    readonly themeVariables: IThemeVariables<T>;
    readonly isDark: boolean;
    createVariant(themeName: string, themeVars?: ThemeVars<T>, themeDefaults?: object): IThemeDefinition<T>;
}

export interface IThemeVariables<T extends string> {
    createVariant(themeVars?: ThemeVars<T>): IThemeVariables<T>;
    set(themeVars: ThemeVars<T>): void;
    get(varName: T): any;
    use(varName: T): any;
}

export type AxisOptionsWithPositionOverrides<T> = T & {
    positionOverrides?: {
        top?: T;
        right?: T;
        bottom?: T;
        left?: T;
    };
};

export interface ThemeOptions {
    baseTheme?: ThemeName;

    // variables?: object;
    // chartDefaults?: object;
    //
    // axesDefaults?: AxisOptionsWithPositionOverrides<ChartAxisOptions<any>>;
    // axisTypeDefaults?: { [K in keyof ChartAxesMap]: AxisOptionsWithPositionOverrides<ChartAxesMap[K]> };
    //
    // seriesDefaults?: {};
    // seriesTypeDefaults?:
    //     | MapTypes<CartesianChartSeries>
    //     | MapTypes<PolarChartSeries>
    //     | MapTypes<HierarchyChartSeries>
    //     | MapTypes<TopologyChartSeries>;
}
