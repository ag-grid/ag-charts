import type { AgChartOptions } from 'ag-charts-types';
import type { ISeries } from '../series/seriesTypes';
export declare function matchSeriesOptions<S extends ISeries<any, any>>(series: S[], optSeries: NonNullable<AgChartOptions['series']>, oldOptsSeries?: AgChartOptions['series']): {
    status: "no-overlap";
    oldKeys: IterableIterator<string>;
    newKeys: IterableIterator<string>;
    changes?: undefined;
} | {
    status: "overlap";
    changes: ({
        opts: import("ag-charts-types").AgCartesianSeriesOptions | import("ag-charts-types").AgPolarSeriesOptions | import("ag-charts-types").AgHierarchySeriesOptions | import("ag-charts-types").AgTopologySeriesOptions | import("ag-charts-types").AgFlowProportionSeriesOptions;
        idx: number;
        status: "add";
        series?: undefined;
        diff?: undefined;
    } | {
        opts: import("ag-charts-types").AgCartesianSeriesOptions | import("ag-charts-types").AgPolarSeriesOptions | import("ag-charts-types").AgHierarchySeriesOptions | import("ag-charts-types").AgTopologySeriesOptions | import("ag-charts-types").AgFlowProportionSeriesOptions;
        series: S;
        diff: any;
        idx: number;
        status: "series-grouping";
    } | {
        opts: import("ag-charts-types").AgCartesianSeriesOptions | import("ag-charts-types").AgPolarSeriesOptions | import("ag-charts-types").AgHierarchySeriesOptions | import("ag-charts-types").AgTopologySeriesOptions | import("ag-charts-types").AgFlowProportionSeriesOptions;
        series: S;
        diff: any;
        idx: number;
        status: "update";
    } | {
        opts: import("ag-charts-types").AgCartesianSeriesOptions | import("ag-charts-types").AgPolarSeriesOptions | import("ag-charts-types").AgHierarchySeriesOptions | import("ag-charts-types").AgTopologySeriesOptions | import("ag-charts-types").AgFlowProportionSeriesOptions;
        series: S;
        idx: number;
        status: "no-op";
        diff?: undefined;
    } | {
        series: S;
        idx: number;
        status: "remove";
        opts?: undefined;
        diff?: undefined;
    })[];
    oldKeys?: undefined;
    newKeys?: undefined;
};
