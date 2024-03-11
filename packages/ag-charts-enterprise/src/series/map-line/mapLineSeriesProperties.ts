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
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
    BaseProperties,
    SeriesProperties,
    SeriesTooltip,
} = _ModuleSupport;
const { Label } = _Scene;

export interface MapLineNodeLabelDatum extends _Util.PointLabelDatum {}

export interface MapLineNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly stroke: string | undefined;
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly projectedGeometry: _ModuleSupport.Geometry | undefined;
}

class MapLineSeriesLabel extends Label<AgMapLineSeriesLabelFormatterParams> {
    @Validate(STRING)
    placement: _Util.LabelPlacement = 'bottom';
}

class MapLineSeriesBackground extends BaseProperties {
    @Validate(GEOJSON_OBJECT, { optional: true })
    topology: _ModuleSupport.FeatureCollection | undefined = undefined;

    @Validate(STRING, { optional: true })
    id: string | undefined = undefined;

    @Validate(STRING)
    topologyIdKey: string = 'name';

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
}

export class MapLineSeriesProperties extends SeriesProperties<AgMapLineSeriesOptions> {
    @Validate(GEOJSON_OBJECT, { optional: true })
    topology?: _ModuleSupport.FeatureCollection = undefined;

    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING)
    idKey: string = '';

    @Validate(STRING)
    topologyIdKey: string = 'name';

    @Validate(STRING, { optional: true })
    idName: string | undefined = undefined;

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
    readonly background = new MapLineSeriesBackground();

    @Validate(OBJECT)
    readonly label = new MapLineSeriesLabel();

    @Validate(OBJECT)
    override tooltip = new SeriesTooltip<AgMapLineSeriesTooltipRendererParams<any>>();
}
