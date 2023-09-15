import type { CssColor, PixelSize } from '../../options/types';
import type { AgSeriesMarker, AgSeriesMarkerFormatterParams } from '../seriesOptions';

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

export interface AgCartesianSeriesMarker<DatumType> extends AgSeriesMarker {
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: AgCartesianSeriesMarkerFormatter<DatumType>;
}
