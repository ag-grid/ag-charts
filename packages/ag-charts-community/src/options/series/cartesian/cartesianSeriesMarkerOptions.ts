import type { CssColor, PixelSize } from '../../chart/types';
import type { AgSeriesMarkerFormatterParams } from '../markerOptions';

export interface AgCartesianSeriesMarkerFormatterParams<DatumType> extends AgSeriesMarkerFormatterParams<DatumType> {
    xKey: string;
    yKey: string;
}

export type AgCartesianSeriesMarkerFormatter<DatumType> = (
    params: AgCartesianSeriesMarkerFormatterParams<DatumType>
) => AgCartesianSeriesMarkerFormat | undefined;

export interface AgCartesianSeriesMarkerFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
    size?: PixelSize;
}
