import type {
    AgBaseRadarSeriesOptions,
    AgRadarSeriesLabelFormatterParams,
    AgRadarSeriesTooltipRendererParams,
    AgRadialSeriesOptionsKeys,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

export interface RadarNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly label?: {
        text: string;
        x: number;
        y: number;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    };
    readonly point: Readonly<_ModuleSupport.SizedPoint>;
    readonly angleValue: any;
    readonly radiusValue: any;
}

const {
    Label,
    SeriesMarker,
    SeriesProperties,
    SeriesTooltip,
    TempValidate,
    BOOLEAN,
    COLOR_STRING,
    NUMBER,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

export class RadarSeriesProperties<T extends AgBaseRadarSeriesOptions> extends SeriesProperties<T> {
    @TempValidate(STRING)
    angleKey!: string;

    @TempValidate(STRING)
    radiusKey!: string;

    @TempValidate(STRING, { optional: true })
    angleName?: string;

    @TempValidate(STRING, { optional: true })
    radiusName?: string;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(NUMBER)
    rotation: number = 0;

    @TempValidate(OBJECT)
    readonly marker = new SeriesMarker<AgRadialSeriesOptionsKeys>();

    @TempValidate(OBJECT)
    readonly label = new Label<AgRadarSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRadarSeriesTooltipRendererParams<any>>();

    @TempValidate(BOOLEAN)
    connectMissingData: boolean = false;
}
