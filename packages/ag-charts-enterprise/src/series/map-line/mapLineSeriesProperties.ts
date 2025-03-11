import type {
    AgMapLineSeriesItemStylerParams,
    AgMapLineSeriesLabelFormatterParams,
    AgMapLineSeriesOptions,
    AgMapLineSeriesStyle,
    AgMapLineSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { GEOJSON_OBJECT } from '../map-util/validation';

const {
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TempValidate,
    SeriesProperties,
    SeriesTooltip,
    Label,
} = _ModuleSupport;

export interface MapLineNodeLabelDatum extends _ModuleSupport.PointLabelDatum {}

export interface MapLineNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly idValue: string;
    readonly labelValue: string | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly projectedGeometry: _ModuleSupport.Geometry | undefined;
}

export class MapLineSeriesProperties extends SeriesProperties<AgMapLineSeriesOptions> {
    @TempValidate(GEOJSON_OBJECT, { optional: true })
    topology?: _ModuleSupport.FeatureCollection = undefined;

    @TempValidate(STRING, { optional: true })
    title?: string;

    @TempValidate(STRING, { optional: true })
    legendItemName?: string;

    @TempValidate(STRING)
    idKey: string = '';

    @TempValidate(STRING)
    topologyIdKey: string = 'name';

    @TempValidate(STRING, { optional: true })
    idName?: string = undefined;

    @TempValidate(STRING, { optional: true })
    labelKey?: string = undefined;

    @TempValidate(STRING, { optional: true })
    labelName?: string = undefined;

    @TempValidate(STRING, { optional: true })
    sizeKey?: string;

    @TempValidate(STRING, { optional: true })
    sizeName?: string;

    @TempValidate(STRING, { optional: true })
    colorKey?: string;

    @TempValidate(STRING, { optional: true })
    colorName?: string;

    @TempValidate(NUMBER_ARRAY, { optional: true })
    sizeDomain?: [number, number];

    @TempValidate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    maxStrokeWidth?: number = undefined;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgMapLineSeriesItemStylerParams<unknown>, AgMapLineSeriesStyle>;

    @TempValidate(OBJECT)
    readonly label = new Label<AgMapLineSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgMapLineSeriesTooltipRendererParams<any>>();
}
