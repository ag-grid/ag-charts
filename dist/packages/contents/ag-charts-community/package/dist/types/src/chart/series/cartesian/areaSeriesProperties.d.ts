import type { AgAreaSeriesLabelFormatterParams, AgAreaSeriesOptionsKeys, AgCartesianSeriesTooltipRendererParams, AgSeriesAreaOptions } from 'ag-charts-types';
import { DropShadow } from '../../../scene/dropShadow';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
import { InterpolationProperties } from './interpolationProperties';
export declare class AreaSeriesProperties extends CartesianSeriesProperties<AgSeriesAreaOptions> {
    xKey: string;
    xName?: string;
    yKey: string;
    yName?: string;
    normalizedTo?: number;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    interpolation: InterpolationProperties;
    readonly shadow: DropShadow;
    readonly marker: SeriesMarker<AgAreaSeriesOptionsKeys>;
    readonly label: Label<AgAreaSeriesLabelFormatterParams, any>;
    readonly tooltip: SeriesTooltip<AgCartesianSeriesTooltipRendererParams<any>>;
    connectMissingData: boolean;
}
