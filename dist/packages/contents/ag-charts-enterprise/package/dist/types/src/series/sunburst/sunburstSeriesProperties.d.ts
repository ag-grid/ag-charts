import type { AgSunburstSeriesFormatterParams, AgSunburstSeriesLabelFormatterParams, AgSunburstSeriesOptions, AgSunburstSeriesStyle, AgSunburstSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { AutoSizeableSecondaryLabel, AutoSizedLabel } from '../util/labelFormatter';
declare const HierarchySeriesProperties: typeof _ModuleSupport.HierarchySeriesProperties, HighlightStyle: typeof _ModuleSupport.HighlightStyle;
declare class SunburstSeriesTileHighlightStyle extends HighlightStyle {
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    readonly label: AutoSizedLabel<AgSunburstSeriesLabelFormatterParams<any>>;
    readonly secondaryLabel: AutoSizedLabel<AgSunburstSeriesLabelFormatterParams<any>>;
}
export declare class SunburstSeriesProperties extends HierarchySeriesProperties<AgSunburstSeriesOptions> {
    sizeName?: string;
    labelKey?: string;
    secondaryLabelKey?: string;
    fillOpacity: number;
    strokeWidth: number;
    strokeOpacity: number;
    cornerRadius: number;
    sectorSpacing?: number;
    padding?: number;
    formatter?: (params: AgSunburstSeriesFormatterParams) => AgSunburstSeriesStyle;
    highlightStyle: SunburstSeriesTileHighlightStyle;
    readonly label: AutoSizedLabel<AgSunburstSeriesLabelFormatterParams<any>>;
    readonly secondaryLabel: AutoSizeableSecondaryLabel<AgSunburstSeriesLabelFormatterParams<any>>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgSunburstSeriesTooltipRendererParams<any>>;
}
export {};
