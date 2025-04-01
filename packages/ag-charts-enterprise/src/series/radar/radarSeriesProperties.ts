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

const { Label, SeriesMarker, SeriesProperties, SeriesTooltip, Property } = _ModuleSupport;

export class RadarSeriesProperties<T extends AgBaseRadarSeriesOptions<unknown>> extends SeriesProperties<T> {
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
    readonly marker = new SeriesMarker<AgRadialSeriesOptionsKeys>();

    @Property
    readonly label = new Label<AgRadarSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = new SeriesTooltip<AgRadarSeriesTooltipRendererParams<any>>();

    @Property
    connectMissingData: boolean = false;
}
