import type { AgBarSeriesItemStylerParams, AgBarSeriesLabelFormatterParams, AgBarSeriesLabelPlacement, AgBarSeriesOptions, AgBarSeriesStyle, AgBarSeriesTooltipRendererParams, Styler } from 'ag-charts-types';
import { DropShadow } from '../../../scene/dropShadow';
import { Label } from '../../label';
import { SeriesTooltip } from '../seriesTooltip';
import { AbstractBarSeriesProperties } from './abstractBarSeries';
declare class BarSeriesLabel extends Label<AgBarSeriesLabelFormatterParams> {
    placement: AgBarSeriesLabelPlacement;
}
export declare class BarSeriesProperties extends AbstractBarSeriesProperties<AgBarSeriesOptions> {
    xKey: string;
    xName?: string;
    yKey: string;
    yName?: string;
    stackGroup?: string;
    normalizedTo?: number;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    cornerRadius: number;
    crisp?: boolean;
    itemStyler?: Styler<AgBarSeriesItemStylerParams<unknown>, AgBarSeriesStyle>;
    readonly shadow: DropShadow;
    readonly label: BarSeriesLabel;
    readonly tooltip: SeriesTooltip<AgBarSeriesTooltipRendererParams<any>>;
}
export {};
