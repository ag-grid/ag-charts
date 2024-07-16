import type { AgScatterSeriesLabelFormatterParams, AgScatterSeriesOptions, AgScatterSeriesOptionsKeys, AgScatterSeriesTooltipRendererParams } from '../../../options/agChartOptions';
import type { SizedPoint } from '../../../scene/point';
import type { LabelPlacement, MeasuredLabel } from '../../../scene/util/labelPlacement';
import { Label } from '../../label';
import type { MarkerConstructor } from '../../marker/util';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';
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
    readonly marker: SeriesMarker<AgScatterSeriesOptionsKeys, ScatterNodeDatum>;
    readonly label: ScatterSeriesLabel;
    readonly tooltip: SeriesTooltip<AgScatterSeriesTooltipRendererParams<any>>;
}
export {};
