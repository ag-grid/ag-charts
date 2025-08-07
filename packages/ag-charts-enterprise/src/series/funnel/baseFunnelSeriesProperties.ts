import type {
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

interface FunnelSeriesLabel extends _ModuleSupport.Label<AgFunnelSeriesLabelFormatterParams> {}

export interface BaseFunnelProperties<TOpts extends object> extends _ModuleSupport.AbstractBarSeriesProperties<TOpts> {
    stageKey: string;
    valueKey: string;
    valueName?: string;
    fills: InternalAgColorType[];
    strokes: string[];
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
    label: FunnelSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<Omit<AgFunnelSeriesTooltipRendererParams<unknown>, 'context'>>;
    getStyle: (datumIndex: number) => Required<AgFunnelSeriesStyle> & { opacity: number };
}
