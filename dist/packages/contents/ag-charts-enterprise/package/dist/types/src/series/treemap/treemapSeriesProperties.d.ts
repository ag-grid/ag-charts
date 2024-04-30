import type { AgTreemapSeriesFormatterParams, AgTreemapSeriesLabelFormatterParams, AgTreemapSeriesOptions, AgTreemapSeriesStyle, AgTreemapSeriesTooltipRendererParams, TextAlign, VerticalAlign } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { AutoSizeableSecondaryLabel, AutoSizedLabel } from '../util/labelFormatter';
declare const Label: typeof _Scene.Label;
declare const BaseProperties: typeof _ModuleSupport.BaseProperties, HierarchySeriesProperties: typeof _ModuleSupport.HierarchySeriesProperties, HighlightStyle: typeof _ModuleSupport.HighlightStyle;
declare class TreemapGroupLabel extends Label<AgTreemapSeriesLabelFormatterParams> {
    spacing: number;
}
declare class TreemapSeriesGroup extends BaseProperties {
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    cornerRadius: number;
    textAlign: TextAlign;
    gap: number;
    padding: number;
    interactive: boolean;
    readonly label: TreemapGroupLabel;
}
declare class TreemapSeriesTile extends BaseProperties {
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    cornerRadius: number;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
    gap: number;
    padding: number;
    readonly label: AutoSizedLabel<AgTreemapSeriesLabelFormatterParams<any>>;
    readonly secondaryLabel: AutoSizeableSecondaryLabel<AgTreemapSeriesLabelFormatterParams<any>>;
}
declare class TreemapSeriesGroupHighlightStyle extends BaseProperties {
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    readonly label: AutoSizedLabel<AgTreemapSeriesLabelFormatterParams<any>>;
}
declare class TreemapSeriesTileHighlightStyle extends BaseProperties {
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    readonly label: AutoSizedLabel<AgTreemapSeriesLabelFormatterParams<any>>;
    readonly secondaryLabel: AutoSizeableSecondaryLabel<AgTreemapSeriesLabelFormatterParams<any>>;
}
declare class TreemapSeriesHighlightStyle extends HighlightStyle {
    readonly group: TreemapSeriesGroupHighlightStyle;
    readonly tile: TreemapSeriesTileHighlightStyle;
}
export declare class TreemapSeriesProperties extends HierarchySeriesProperties<AgTreemapSeriesOptions> {
    sizeName?: string;
    labelKey?: string;
    secondaryLabelKey?: string;
    formatter?: (params: AgTreemapSeriesFormatterParams) => AgTreemapSeriesStyle;
    readonly highlightStyle: TreemapSeriesHighlightStyle;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>;
    readonly group: TreemapSeriesGroup;
    readonly tile: TreemapSeriesTile;
    undocumentedGroupFills: string[];
    undocumentedGroupStrokes: string[];
}
export {};
