import type {
    AgMapShapeSeriesFormatterParams,
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesOptions,
    AgMapShapeSeriesStyle,
    AgMapShapeSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { GEOJSON_OBJECT } from '../map-util/validation';

// import type { FeatureCollection, Geometry } from 'geojson';
type FeatureCollection = any;
type Geometry = any;

const {
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
    SeriesProperties,
    SeriesTooltip,
} = _ModuleSupport;
const { Label } = _Scene;

export interface MapShapeNodeLabelDatum extends _Util.PointLabelDatum {}

export interface MapShapeNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly idValue: string;
    readonly fill: string;
    readonly colorValue: number | undefined;
    readonly projectedGeometry: Geometry | undefined;
}

class MapShapeSeriesLabel extends Label<AgMapShapeSeriesLabelFormatterParams> {
    @Validate(STRING)
    placement: _Util.LabelPlacement = 'bottom';
}

export class MapShapeSeriesProperties extends SeriesProperties<AgMapShapeSeriesOptions> {
    @Validate(GEOJSON_OBJECT, { optional: true })
    topology?: FeatureCollection = undefined;

    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING)
    idKey: string = '';

    @Validate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @Validate(STRING)
    topologyIdKey: string = 'name';

    @Validate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    colorKey?: string;

    @Validate(STRING, { optional: true })
    colorName?: string;

    @Validate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(RATIO)
    fillOpacity: number = 1;

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
    formatter?: (params: AgMapShapeSeriesFormatterParams<any>) => AgMapShapeSeriesStyle;

    @Validate(OBJECT)
    readonly label = new MapShapeSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgMapShapeSeriesTooltipRendererParams<any>>();
}
