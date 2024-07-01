import type { _ModuleSupport } from 'ag-charts-community';
export interface FlowProportionSeriesProperties<SeriesOptions extends {}> extends _ModuleSupport.SeriesProperties<SeriesOptions> {
    nodes: any[] | undefined;
    fromKey: string;
    toKey: string;
    idKey: string;
    idName: string | undefined;
    labelKey: string | undefined;
    labelName: string | undefined;
    sizeKey: string | undefined;
    sizeName: string | undefined;
    fills: string[];
    strokes: string[];
}
