import { Series } from "../series";
import { ChartAxisDirection } from "../../chartAxis";
import { SeriesMarker, SeriesMarkerFormatterParams } from "../seriesMarker";

export abstract class CartesianSeries extends Series {
    directionKeys: { [key in ChartAxisDirection]?: string[] } = {
        [ChartAxisDirection.X]: ['xKey'],
        [ChartAxisDirection.Y]: ['yKey']
    };
}

export interface CartesianSeriesMarkerFormat {
    fill?: string,
    stroke?: string,
    strokeWidth?: number,
    size?: number
}
export class CartesianSeriesMarker extends SeriesMarker {
    formatter?: (params: CartesianSeriesMarkerFormatterParams) => CartesianSeriesMarkerFormat;
}

export interface CartesianSeriesMarkerFormatterParams extends SeriesMarkerFormatterParams {
    xKey: string;
    yKey: string;
}
