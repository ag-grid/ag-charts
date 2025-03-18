import type {
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import type { _ModuleSupport } from 'ag-charts-community';

interface FunnelSeriesLabel extends _ModuleSupport.Label<AgFunnelSeriesLabelFormatterParams> {}

export interface BaseFunnelProperties<SeriesOptions extends object>
    extends _ModuleSupport.AbstractBarSeriesProperties<SeriesOptions> {
    stageKey: string;
    valueKey: string;
    valueName?: string;
    fills: _ModuleSupport.InternalAgColorType[];
    strokes: string[];
    defaultColorRange: string[];
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
    label: FunnelSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>;
}
