import type { _ModuleSupport } from 'ag-charts-community';

export interface FlowProportionSeriesProperties<SeriesOptions extends {}>
    extends _ModuleSupport.SeriesProperties<SeriesOptions> {
    nodes: any[] | undefined;
    fromIdKey: string;
    fromIdName: string | undefined;
    toIdKey: string;
    toIdName: string | undefined;
    nodeIdKey: string;
    nodeIdName: string | undefined;
    labelKey: string | undefined;
    labelName: string | undefined;
    sizeKey: string | undefined;
    sizeName: string | undefined;
    nodeSizeKey: string | undefined;
    nodeSizeName: string | undefined;
}
