import type { AgScatterSeriesItemStylerParams, AgScatterSeriesLabelFormatterParams, AgScatterSeriesOptions, AgScatterSeriesOptionsKeys, AgScatterSeriesTooltipRendererParams, AgSeriesMarkerStyle, Styler } from 'ag-charts-types';
import type { SizedPoint } from '../../../scene/point';
import type { LabelPlacement, MeasuredLabel } from '../../../scene/util/labelPlacement';
import { Label } from '../../label';
import type { MarkerConstructor, MarkerShape } from '../../marker/util';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';
export interface ScatterNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly marker: MarkerConstructor;
    readonly fill: string | undefined;
}
declare class ScatterSeriesLabel extends Label<AgScatterSeriesLabelFormatterParams> {
    placement: LabelPlacement;
}
export declare class ScatterSeriesProperties extends CartesianSeriesProperties<AgScatterSeriesOptions> {
    xKey: string;
    yKey: string;
    labelKey?: string;
    colorKey?: string;
    xName?: string;
    yName?: string;
    labelName?: string;
    colorName?: string;
    colorDomain?: number[];
    colorRange: string[];
    title?: string;
    shape: MarkerShape;
    size: number;
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    itemStyler?: Styler<AgScatterSeriesItemStylerParams<unknown>, AgSeriesMarkerStyle>;
    readonly label: ScatterSeriesLabel;
    readonly tooltip: SeriesTooltip<AgScatterSeriesTooltipRendererParams<any>>;
    readonly marker: SeriesMarker<AgScatterSeriesOptionsKeys>;
}
export {};
