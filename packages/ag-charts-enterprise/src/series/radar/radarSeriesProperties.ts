import type {
    AgBaseRadarSeriesOptions,
    AgRadarSeriesLabelFormatterParams,
    AgRadarSeriesStyle,
    AgRadarSeriesTooltipRendererParams,
    AgRadialSeriesOptionsKeys,
    AgSeriesMarkerStyle,
    ContextDefault,
    DatumDefault,
    TextOrSegments,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Property } from 'ag-charts-core';

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

const { Label, SeriesMarker, SeriesProperties, makeSeriesTooltip } = _ModuleSupport;
export class RadarSeriesProperties<
    TStyle extends AgRadarSeriesStyle,
    TOpts extends AgBaseRadarSeriesOptions<DatumDefault, ContextDefault, TStyle>,
> extends SeriesProperties<TOpts> {
    @Property
    angleKey!: string;

    @Property
    radiusKey!: string;

    @Property
    angleName?: string;

    @Property
    radiusName?: string;

    @Property
    angleKeyAxis: string = 'angle';

    @Property
    radiusKeyAxis: string = 'radius';

    @Property
    legendItemName?: string;

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
    styler?: TOpts['styler'];

    @Property
    readonly marker = new SeriesMarker<AgRadialSeriesOptionsKeys>();

    @Property
    readonly label = new Label<AgRadarSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRadarSeriesTooltipRendererParams<any>>();

    @Property
    connectMissingData: boolean = false;
}
