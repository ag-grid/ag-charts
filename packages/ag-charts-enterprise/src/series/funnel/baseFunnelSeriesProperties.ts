import type {
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import type {
    InternalAgColorType,
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';

interface FunnelSeriesLabel extends _ModuleSupport.Label<AgFunnelSeriesLabelFormatterParams> {}

export interface BaseFunnelProperties<SeriesOptions extends object>
    extends _ModuleSupport.AbstractBarSeriesProperties<SeriesOptions> {
    stageKey: string;
    valueKey: string;
    valueName?: string;
    fills: InternalAgColorType[];
    strokes: string[];
    fillGradientDefaults: RequiredInternalAgGradientColor;
    fillPatternDefaults: RequiredInternalAgPatternColor;
    fillImageDefaults: RequiredInternalAgImageFill;
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
    label: FunnelSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<Omit<AgFunnelSeriesTooltipRendererParams<unknown>, 'context'>>;
}
