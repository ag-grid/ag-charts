import type {
    AgChordSeriesTooltipRendererParams,
    AgFillType,
    AgSankeySeriesTooltipRendererParams,
    _ModuleSupport,
} from 'ag-charts-community';

export interface FlowProportionSeriesProperties<SeriesOptions extends object>
    extends _ModuleSupport.SeriesProperties<SeriesOptions> {
    nodes: any[] | undefined;
    fromKey: string;
    toKey: string;
    idKey: string;
    idName: string | undefined;
    labelKey: string | undefined;
    labelName: string | undefined;
    sizeKey: string | undefined;
    sizeName: string | undefined;
    fills: AgFillType[];
    strokes: string[];
    tooltip: _ModuleSupport.SeriesTooltip<
        AgChordSeriesTooltipRendererParams<any> & AgSankeySeriesTooltipRendererParams<any>
    >;
}
