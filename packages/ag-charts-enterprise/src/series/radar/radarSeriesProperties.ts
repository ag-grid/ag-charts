import type {
    AgBaseRadarSeriesOptions,
    AgPieSeriesFormat,
    AgPieSeriesFormatterParams,
    AgPieSeriesTooltipRendererParams,
    AgRadarSeriesLabelFormatterParams,
    AgRadialSeriesOptionsKeys,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { RadarNodeDatum } from './radarSeries';

const { Label } = _Scene;
const {
    SeriesMarker,
    SeriesProperties,
    SeriesTooltip,
    Validate,
    COLOR_STRING,
    DEGREE,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

export class RadarSeriesProperties<T extends AgBaseRadarSeriesOptions> extends SeriesProperties<T> {
    @Validate(STRING)
    angleKey!: string;

    @Validate(STRING)
    radiusKey!: string;

    @Validate(STRING, { optional: true })
    angleName?: string;

    @Validate(STRING, { optional: true })
    radiusName?: string;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat;

    @Validate(DEGREE)
    rotation: number = 0;

    @Validate(OBJECT)
    readonly marker = new SeriesMarker<AgRadialSeriesOptionsKeys, RadarNodeDatum>();

    @Validate(OBJECT)
    readonly label = new Label<AgRadarSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgPieSeriesTooltipRendererParams>();
}
