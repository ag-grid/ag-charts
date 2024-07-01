import { type AgSankeySeriesLabelFormatterParams, type AgSankeySeriesLinkItemStylerParams, type AgSankeySeriesLinkOptions, type AgSankeySeriesLinkStyle, type AgSankeySeriesNodeItemStylerParams, type AgSankeySeriesNodeOptions, type AgSankeySeriesNodeStyle, type AgSankeySeriesOptions, type AgSankeySeriesTooltipRendererParams, type Styler, _ModuleSupport, _Scene } from 'ag-charts-community';
import type { FlowProportionLinkDatum, FlowProportionNodeDatum } from '../flow-proportion/flowProportionSeries';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties, SeriesProperties: typeof _ModuleSupport.SeriesProperties;
declare const Label: typeof _Scene.Label;
export interface SankeyNodeDatum extends FlowProportionNodeDatum {
    size: number;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface SankeyLinkDatum extends FlowProportionLinkDatum<SankeyNodeDatum> {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    height: number;
}
export type SankeyDatum = SankeyLinkDatum | SankeyNodeDatum;
export interface SankeyNodeLabelDatum {
    x: number;
    y: number;
    leading: boolean;
    text: string;
}
export declare class SankeySeriesLabelProperties extends Label<AgSankeySeriesLabelFormatterParams> {
    spacing: number;
}
export declare class SankeySeriesLinkProperties extends BaseProperties<AgSankeySeriesLinkOptions<any>> {
    fill: string | undefined;
    fillOpacity: number;
    stroke: string | undefined;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    itemStyler?: Styler<AgSankeySeriesLinkItemStylerParams<unknown>, AgSankeySeriesLinkStyle>;
}
export declare class SankeySeriesNodeProperties extends BaseProperties<AgSankeySeriesNodeOptions<any>> {
    spacing: number;
    width: number;
    alignment: 'left' | 'right' | 'center' | 'justify';
    fill: string | undefined;
    fillOpacity: number;
    stroke: string | undefined;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    itemStyler?: Styler<AgSankeySeriesNodeItemStylerParams<unknown>, AgSankeySeriesNodeStyle>;
}
export declare class SankeySeriesProperties extends SeriesProperties<AgSankeySeriesOptions> {
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
    readonly label: SankeySeriesLabelProperties;
    readonly link: SankeySeriesLinkProperties;
    readonly node: SankeySeriesNodeProperties;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgSankeySeriesTooltipRendererParams<any>>;
}
export {};
