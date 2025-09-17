import type {
    AgBaseRadarSeriesOptions,
    AgRadarSeriesLabelFormatterParams,
    AgRadarSeriesTooltipRendererParams,
    AgRadialSeriesOptionsKeys,
    AgSeriesMarkerStyle,
    Styler,
    TextOrSegments,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

export interface RadarNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly label?: {
        x: number;
        y: number;
        text: TextOrSegments;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    };
    readonly point: Readonly<_ModuleSupport.SizedPoint>;
    readonly angleValue: any;
    readonly radiusValue: any;
    style?: AgSeriesMarkerStyle;
}

const { Label, SeriesMarker, SeriesProperties, makeSeriesTooltip, Property } = _ModuleSupport;

export class RadarSeriesProperties<T extends AgBaseRadarSeriesOptions> extends SeriesProperties<T> {
    @Property
    angleKey!: string;

    @Property
    radiusKey!: string;

    @Property
    angleName?: string;

    @Property
    radiusName?: string;

    @Property
    stroke: string = 'black';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    rotation: number = 0;

    @Property
    styler?: Styler<unknown, undefined>;

    @Property
    readonly marker = new SeriesMarker<AgRadialSeriesOptionsKeys>();

    @Property
    readonly label = new Label<AgRadarSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRadarSeriesTooltipRendererParams<any>>();

    @Property
    connectMissingData: boolean = false;
}
