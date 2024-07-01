import type { AgLineSeriesLabelFormatterParams, AgLineSeriesOptions, AgLineSeriesOptionsKeys, AgLineSeriesTooltipRendererParams, FontStyle, FontWeight } from 'ag-charts-types';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';
import { InterpolationProperties } from './interpolationProperties';
export interface LineNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: CartesianSeriesNodeDatum['point'] & {
        readonly moveTo: boolean;
    };
    readonly label?: {
        readonly text: string;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        readonly fill?: string;
    };
}
export declare class LineSeriesProperties extends CartesianSeriesProperties<AgLineSeriesOptions> {
    xKey: string;
    yKey: string;
    xName?: string;
    yName?: string;
    stackGroup?: string;
    normalizedTo?: number;
    title?: string;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    interpolation: InterpolationProperties;
    readonly marker: SeriesMarker<AgLineSeriesOptionsKeys>;
    readonly label: Label<AgLineSeriesLabelFormatterParams, any>;
    readonly tooltip: SeriesTooltip<AgLineSeriesTooltipRendererParams>;
    connectMissingData: boolean;
}
