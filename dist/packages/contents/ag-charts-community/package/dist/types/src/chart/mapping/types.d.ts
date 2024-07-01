import type { AgCartesianChartOptions, AgFlowProportionChartOptions, AgHierarchyChartOptions, AgPolarChartOptions, AgTopologyChartOptions } from 'ag-charts-types';
import type { AgChartOptions } from 'ag-charts-types';
export type AxesOptionsTypes = NonNullable<AgCartesianChartOptions['axes']>[number];
export type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number];
export type SeriesType = SeriesOptionsTypes['type'];
export declare function optionsType(input: {
    series?: {
        type?: SeriesType;
    }[];
}): NonNullable<SeriesType>;
export declare function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions;
export declare function isAgPolarChartOptions(input: AgChartOptions): input is AgPolarChartOptions;
export declare function isAgHierarchyChartOptions(input: AgChartOptions): input is AgHierarchyChartOptions;
export declare function isAgTopologyChartOptions(input: AgChartOptions): input is AgTopologyChartOptions;
export declare function isAgFlowProportionChartOptions(input: AgChartOptions): input is AgFlowProportionChartOptions;
export declare function isAgPolarChartOptionsWithSeriesBasedLegend(input: AgChartOptions): input is AgPolarChartOptions;
export declare function isSeriesOptionType(input?: string): input is NonNullable<SeriesType>;
export declare function isAxisOptionType(input?: string): input is NonNullable<AxesOptionsTypes>['type'];
