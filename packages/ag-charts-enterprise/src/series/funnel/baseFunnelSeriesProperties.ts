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
    fills: string[];
    strokes: string[];
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
    label: FunnelSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>;
}
