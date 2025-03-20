import type {
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    AgPatternColor,
    Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import type { InternalAgColorType, InternalAgGradientColor } from 'ag-charts-core';

interface FunnelSeriesLabel extends _ModuleSupport.Label<AgFunnelSeriesLabelFormatterParams> {}

export interface BaseFunnelProperties<SeriesOptions extends object>
    extends _ModuleSupport.AbstractBarSeriesProperties<SeriesOptions> {
    stageKey: string;
    valueKey: string;
    valueName?: string;
    fills: InternalAgColorType[];
    strokes: string[];
    fillGradientDefaults: Required<InternalAgGradientColor>;
    fillPatternDefaults: Required<AgPatternColor>;
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
    label: FunnelSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>;
}
