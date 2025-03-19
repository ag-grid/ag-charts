import type {
    AgMapMarkerSeriesItemStylerParams,
    AgMapMarkerSeriesLabelFormatterParams,
    AgMapMarkerSeriesOptions,
    AgMapMarkerSeriesStyle,
    AgMapMarkerSeriesTooltipRendererParams,
    AgMarkerShape,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { GEOJSON_OBJECT } from '../map-util/validation';

const {
    FillGradientDefaults,
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    NUMBER_ARRAY,
    OBJECT,
    OR,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    MARKER_SHAPE,
    LINE_DASH,
    TempValidate,
    SeriesProperties,
    SeriesTooltip,
    Label,
} = _ModuleSupport;

export interface MapMarkerNodeLabelDatum extends _ModuleSupport.PointLabelDatum {}

export interface MapMarkerNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly idValue: string | undefined;
    readonly lonValue: number | undefined;
    readonly latValue: number | undefined;
    readonly labelValue: string | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly point: Readonly<_ModuleSupport.SizedPoint>;
}

class MapMarkerSeriesLabel extends Label<AgMapMarkerSeriesLabelFormatterParams> {
    @TempValidate(STRING)
    placement: _ModuleSupport.LabelPlacement = 'bottom';
}

export class MapMarkerSeriesProperties extends SeriesProperties<AgMapMarkerSeriesOptions> {
    @TempValidate(GEOJSON_OBJECT, { optional: true })
    topology: _ModuleSupport.FeatureCollection | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    title?: string;

    @TempValidate(STRING, { optional: true })
    legendItemName?: string;

    @TempValidate(STRING, { optional: true })
    idKey: string | undefined = undefined;

    @TempValidate(STRING)
    topologyIdKey: string = 'name';

    @TempValidate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    latitudeKey: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    latitudeName: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    longitudeKey: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    longitudeName: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    sizeKey?: string;

    @TempValidate(STRING, { optional: true })
    sizeName?: string;

    @TempValidate(STRING, { optional: true })
    colorKey?: string;

    @TempValidate(STRING, { optional: true })
    colorName?: string;

    @TempValidate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    /** One of the predefined marker names, or a marker shape function (for user-defined markers). */
    @TempValidate(MARKER_SHAPE)
    shape: AgMarkerShape = 'circle';

    @TempValidate(POSITIVE_NUMBER)
    size: number = 6;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    maxSize: number | undefined;

    @TempValidate(NUMBER_ARRAY, { optional: true })
    sizeDomain?: [number, number];

    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill: _ModuleSupport.InternalAgColorType = 'black';

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgMapMarkerSeriesItemStylerParams<unknown>, AgMapMarkerSeriesStyle>;

    @TempValidate(OBJECT)
    readonly label = new MapMarkerSeriesLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<any>>();
}
