import type { AgPieSeriesItemStylerParams, AgPieSeriesLabelFormatterParams, AgPieSeriesOptions, AgPieSeriesStyle, AgPieSeriesTooltipRendererParams, Styler } from 'ag-charts-types';
import { DropShadow } from '../../../scene/dropShadow';
import { BaseProperties } from '../../../util/properties';
import { Caption } from '../../caption';
import { Label } from '../../label';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';
export declare class PieTitle extends Caption {
    showInLegend: boolean;
}
declare class PieSeriesCalloutLabel extends Label<AgPieSeriesLabelFormatterParams> {
    offset: number;
    minAngle: number;
    minSpacing: number;
    maxCollisionOffset: number;
    avoidCollisions: boolean;
}
declare class PieSeriesSectorLabel extends Label<AgPieSeriesLabelFormatterParams> {
    positionOffset: number;
    positionRatio: number;
}
declare class PieSeriesCalloutLine extends BaseProperties {
    colors?: string[];
    length: number;
    strokeWidth: number;
}
export declare class PieSeriesProperties extends SeriesProperties<AgPieSeriesOptions> {
    angleKey: string;
    angleName?: string;
    radiusKey?: string;
    radiusName?: string;
    radiusMin?: number;
    radiusMax?: number;
    calloutLabelKey?: string;
    calloutLabelName?: string;
    sectorLabelKey?: string;
    sectorLabelName?: string;
    legendItemKey?: string;
    fills: string[];
    strokes: string[];
    fillOpacity: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    cornerRadius: number;
    itemStyler?: Styler<AgPieSeriesItemStylerParams<unknown>, AgPieSeriesStyle>;
    rotation: number;
    outerRadiusOffset: number;
    outerRadiusRatio: number;
    strokeWidth: number;
    sectorSpacing: number;
    readonly title: PieTitle;
    readonly shadow: DropShadow;
    readonly calloutLabel: PieSeriesCalloutLabel;
    readonly sectorLabel: PieSeriesSectorLabel;
    readonly calloutLine: PieSeriesCalloutLine;
    readonly tooltip: SeriesTooltip<AgPieSeriesTooltipRendererParams<any>>;
}
export {};
