import type { AgBubbleSeriesLabelFormatterParams, AgBubbleSeriesOptions, AgBubbleSeriesOptionsKeys, AgBubbleSeriesStyle, AgBubbleSeriesTooltipRendererParams, BubbleSeriesItemStylerParams, LabelPlacement, Styler } from 'ag-charts-types';
import type { SizedPoint } from '../../../scene/point';
import type { MeasuredLabel } from '../../../scene/util/labelPlacement';
import { Label } from '../../label';
import type { MarkerConstructor, MarkerShape } from '../../marker/util';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';
export interface BubbleNodeDatum extends CartesianSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly sizeValue: any;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly marker: MarkerConstructor;
    readonly fill: string | undefined;
}
declare class BubbleSeriesMarker extends SeriesMarker<AgBubbleSeriesOptionsKeys> {
    /**
     * The series `sizeKey` values along with the `size` and `maxSize` configs will be used to
     * determine the size of the marker. All values will be mapped to a marker size within the
     * `[size, maxSize]` range, where the largest values will correspond to the `maxSize` and the
     * lowest to the `size`.
     */
    maxSize: number;
    domain?: [number, number];
}
declare class BubbleSeriesLabel extends Label<AgBubbleSeriesLabelFormatterParams> {
    placement: LabelPlacement;
}
export declare class BubbleSeriesProperties extends CartesianSeriesProperties<AgBubbleSeriesOptions> {
    xKey: string;
    yKey: string;
    sizeKey: string;
    labelKey?: string;
    colorKey?: string;
    xName?: string;
    yName?: string;
    sizeName?: string;
    labelName?: string;
    colorName?: string;
    colorDomain?: number[];
    colorRange: string[];
    title?: string;
    shape: MarkerShape;
    size: number;
    maxSize: number;
    domain?: [number, number];
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    itemStyler?: Styler<BubbleSeriesItemStylerParams<unknown>, AgBubbleSeriesStyle>;
    readonly label: BubbleSeriesLabel;
    readonly tooltip: SeriesTooltip<AgBubbleSeriesTooltipRendererParams>;
    readonly marker: BubbleSeriesMarker;
}
export {};
