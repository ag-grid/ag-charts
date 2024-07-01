import { type AgChordSeriesLabelFormatterParams, type AgChordSeriesLinkItemStylerParams, type AgChordSeriesLinkStyle, type AgChordSeriesNodeItemStylerParams, type AgChordSeriesNodeStyle, type AgChordSeriesOptions, type AgChordSeriesTooltipRendererParams, type Styler, _ModuleSupport, _Scene } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties, SeriesProperties: typeof _ModuleSupport.SeriesProperties;
declare const Label: typeof _Scene.Label;
export declare class ChordSeriesLabelProperties extends Label<AgChordSeriesLabelFormatterParams> {
    spacing: number;
    maxWidth: number;
}
export declare class ChordSeriesLinkProperties extends BaseProperties<AgChordSeriesOptions> {
    fill: string | undefined;
    fillOpacity: number;
    stroke: string | undefined;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    tension: number;
    itemStyler?: Styler<AgChordSeriesLinkItemStylerParams<unknown>, AgChordSeriesLinkStyle>;
}
export declare class ChordSeriesNodeProperties extends BaseProperties<AgChordSeriesOptions> {
    spacing: number;
    width: number;
    fill: string | undefined;
    fillOpacity: number;
    stroke: string | undefined;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    itemStyler?: Styler<AgChordSeriesNodeItemStylerParams<unknown>, AgChordSeriesNodeStyle>;
}
export declare class ChordSeriesProperties extends SeriesProperties<AgChordSeriesOptions> {
    fromKey: string;
    toKey: string;
    idKey: string;
    idName: string | undefined;
    labelKey: string | undefined;
    labelName: string | undefined;
    sizeKey: string | undefined;
    sizeName: string | undefined;
    nodes: any[] | undefined;
    fills: string[];
    strokes: string[];
    readonly label: ChordSeriesLabelProperties;
    readonly link: ChordSeriesLinkProperties;
    readonly node: ChordSeriesNodeProperties;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgChordSeriesTooltipRendererParams<any>>;
}
export {};
