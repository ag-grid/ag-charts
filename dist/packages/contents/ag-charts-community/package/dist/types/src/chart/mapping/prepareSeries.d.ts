import type { AgChartOptions } from '../../options/chart/chartBuilderOptions';
import type { ISeries } from '../series/seriesTypes';
export declare function matchSeriesOptions<S extends ISeries<any, any>>(series: S[], optSeries: NonNullable<AgChartOptions['series']>, oldOptsSeries?: AgChartOptions['series']): {
    status: "no-overlap";
    oldKeys: IterableIterator<string>;
    newKeys: IterableIterator<string>;
    changes?: undefined;
} | {
    status: "overlap";
    changes: ({
        opts: import("../../main").AgCartesianSeriesOptions | import("../../main").AgHierarchySeriesOptions | import("../../main").AgPolarSeriesOptions | import("../../options/series/topology/topologyOptions").AgTopologySeriesOptions;
        idx: number;
        status: "add";
        series?: undefined;
        diff?: undefined;
    } | {
        opts: import("../../main").AgCartesianSeriesOptions | import("../../main").AgHierarchySeriesOptions | import("../../main").AgPolarSeriesOptions | import("../../options/series/topology/topologyOptions").AgTopologySeriesOptions;
        series: S;
        diff: any;
        idx: number;
        status: "series-grouping";
    } | {
        opts: import("../../main").AgCartesianSeriesOptions | import("../../main").AgHierarchySeriesOptions | import("../../main").AgPolarSeriesOptions | import("../../options/series/topology/topologyOptions").AgTopologySeriesOptions;
        series: S;
        diff: any;
        idx: number;
        status: "update";
    } | {
        opts: import("../../main").AgCartesianSeriesOptions | import("../../main").AgHierarchySeriesOptions | import("../../main").AgPolarSeriesOptions | import("../../options/series/topology/topologyOptions").AgTopologySeriesOptions;
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
