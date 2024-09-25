import type {
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

interface FunnelSeriesLabel extends _Scene.Label<AgFunnelSeriesLabelFormatterParams> {}

export interface BaseFunnelProperties<SeriesOptions extends object>
    extends _ModuleSupport.AbstractBarSeriesProperties<SeriesOptions> {
    xKey: string;
    yKey: string;
    xName: string | undefined;
    yName: string | undefined;
    fills: string[];
    strokes: string[];
    cornerRadius: number;
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
    label: FunnelSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>;
}
