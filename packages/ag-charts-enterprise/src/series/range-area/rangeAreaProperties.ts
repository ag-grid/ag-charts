import type {
    AgRangeAreaSeriesLabelFormatterParams,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesOptionsKeys,
    AgRangeAreaSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

export interface RangeAreaMarkerDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly point: Readonly<_Scene.SizedPoint>;
    readonly enabled: boolean;
}

const { DropShadow, Label } = _Scene;
const {
    CartesianSeriesProperties,
    InterpolationProperties,
    SeriesMarker,
    SeriesTooltip,
    Validate,
    BOOLEAN,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    PLACEMENT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class RangeAreaSeriesLabel extends Label<AgRangeAreaSeriesLabelFormatterParams> {
    @Validate(PLACEMENT)
    placement: AgRangeAreaSeriesLabelPlacement = 'outside';

    @Validate(POSITIVE_NUMBER)
    padding: number = 6;
}

export class RangeAreaProperties extends CartesianSeriesProperties<AgRangeAreaSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yLowKey!: string;

    @Validate(STRING)
    yHighKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    yLowName?: string;

    @Validate(STRING, { optional: true })
    yHighName?: string;

    @Validate(COLOR_STRING)
    fill: string = '#99CCFF';

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = '#99CCFF';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(OBJECT)
    interpolation: _ModuleSupport.InterpolationProperties = new InterpolationProperties();

    @Validate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @Validate(OBJECT)
    readonly marker = new SeriesMarker<AgRangeAreaSeriesOptionsKeys, RangeAreaMarkerDatum>();

    @Validate(OBJECT)
    readonly label = new RangeAreaSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>();

    @Validate(BOOLEAN)
    connectMissingData: boolean = false;
}
