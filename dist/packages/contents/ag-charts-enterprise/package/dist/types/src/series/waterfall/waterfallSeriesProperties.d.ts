import type { AgTooltipRendererResult, AgWaterfallSeriesFormat, AgWaterfallSeriesFormatterParams, AgWaterfallSeriesLabelFormatterParams, AgWaterfallSeriesLabelPlacement, AgWaterfallSeriesOptions, AgWaterfallSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const Label: typeof _Scene.Label;
declare const AbstractBarSeriesProperties: typeof _ModuleSupport.AbstractBarSeriesProperties, BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class WaterfallSeriesTotal extends BaseProperties {
    totalType: 'subtotal' | 'total';
    index: number;
    axisLabel: string;
}
declare class WaterfallSeriesItemTooltip extends BaseProperties {
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}
declare class WaterfallSeriesLabel extends Label<AgWaterfallSeriesLabelFormatterParams> {
    placement: AgWaterfallSeriesLabelPlacement;
    padding: number;
}
export declare class WaterfallSeriesItem extends BaseProperties {
    name?: string;
    fill: string;
    stroke: string;
    fillOpacity: number;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeWidth: number;
    cornerRadius: number;
    formatter?: (params: AgWaterfallSeriesFormatterParams<any>) => AgWaterfallSeriesFormat;
    readonly shadow: _Scene.DropShadow;
    readonly label: WaterfallSeriesLabel;
    readonly tooltip: WaterfallSeriesItemTooltip;
}
declare class WaterfallSeriesConnectorLine extends BaseProperties {
    enabled: boolean;
    stroke: string;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeWidth: number;
}
declare class WaterfallSeriesItems extends BaseProperties {
    readonly positive: WaterfallSeriesItem;
    readonly negative: WaterfallSeriesItem;
    readonly total: WaterfallSeriesItem;
}
export declare class WaterfallSeriesProperties extends AbstractBarSeriesProperties<AgWaterfallSeriesOptions> {
    xKey: string;
    yKey: string;
    xName?: string;
    yName?: string;
    readonly item: WaterfallSeriesItems;
    readonly totals: WaterfallSeriesTotal[];
    readonly line: WaterfallSeriesConnectorLine;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgWaterfallSeriesTooltipRendererParams<any>>;
}
export {};
