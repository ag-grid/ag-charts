import type {
    AgColorType,
    AgMapShapeSeriesItemStylerParams,
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesOptions,
    AgMapShapeSeriesStyle,
    AgMapShapeSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { GEOJSON_OBJECT } from '../map-util/validation';
import { AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const {
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    FUNCTION,
    LINE_DASH,
    OR,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TempValidate,
    SeriesProperties,
    SeriesTooltip,
    FillGradientDefaults,
} = _ModuleSupport;

export interface MapShapeNodeLabelDatum {
    readonly x: number;
    readonly y: number;
    readonly text: string;
    readonly fontSize: number;
    readonly lineHeight: number;
}

export interface MapShapeNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly labelValue: string | undefined;
    readonly projectedGeometry: _ModuleSupport.Geometry | undefined;
}

export class MapShapeSeriesProperties extends SeriesProperties<AgMapShapeSeriesOptions> {
    @TempValidate(GEOJSON_OBJECT, { optional: true })
    topology?: _ModuleSupport.FeatureCollection = undefined;

    @TempValidate(STRING, { optional: true })
    title?: string;

    @TempValidate(STRING, { optional: true })
    legendItemName?: string;

    @TempValidate(STRING)
    idKey: string = '';

    @TempValidate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @TempValidate(STRING)
    topologyIdKey: string = 'name';

    @TempValidate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    colorKey?: string;

    @TempValidate(STRING, { optional: true })
    colorName?: string;

    @TempValidate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill: AgColorType = 'black';

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(RATIO)
    fillOpacity: number = 1;

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

    @TempValidate(POSITIVE_NUMBER)
    padding: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgMapShapeSeriesItemStylerParams<unknown>, AgMapShapeSeriesStyle>;

    @TempValidate(OBJECT)
    readonly label = new AutoSizedSecondaryLabel<AgMapShapeSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgMapShapeSeriesTooltipRendererParams<any>>();
}
