import type {
    AgMapLineSeriesFormatterParams,
    AgMapLineSeriesLabelFormatterParams,
    AgMapLineSeriesOptions,
    AgMapLineSeriesStyle,
    AgMapLineSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

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
    Validate,
    SeriesProperties,
    SeriesTooltip,
} = _ModuleSupport;
const { Label } = _Scene;

export interface MapLineNodeLabelDatum extends _Util.PointLabelDatum {}

export interface MapLineNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly stroke: string | undefined;
    readonly strokeWidth: number | undefined;
    readonly idValue: string;
    readonly labelValue: string | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly projectedGeometry: _ModuleSupport.Geometry | undefined;
}

export class MapLineSeriesProperties extends SeriesProperties<AgMapLineSeriesOptions> {
    @Validate(GEOJSON_OBJECT, { optional: true })
    topology?: _ModuleSupport.FeatureCollection = undefined;

    @Validate(STRING, { optional: true })
    title?: string;

    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING)
    idKey: string = '';

    @Validate(STRING)
    topologyIdKey: string = 'name';

    @Validate(STRING, { optional: true })
    idName?: string = undefined;

    @Validate(STRING, { optional: true })
    labelKey?: string = undefined;

    @Validate(STRING, { optional: true })
    labelName?: string = undefined;

    @Validate(STRING, { optional: true })
    sizeKey?: string;

    @Validate(STRING, { optional: true })
    sizeName?: string;

    @Validate(STRING, { optional: true })
    colorKey?: string;

    @Validate(STRING, { optional: true })
    colorName?: string;

    @Validate(NUMBER_ARRAY, { optional: true })
    sizeDomain?: [number, number];

    @Validate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxStrokeWidth?: number = undefined;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgMapLineSeriesFormatterParams<any>) => AgMapLineSeriesStyle;

    @Validate(OBJECT)
    readonly label = new Label<AgMapLineSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgMapLineSeriesTooltipRendererParams<any>>();
}
