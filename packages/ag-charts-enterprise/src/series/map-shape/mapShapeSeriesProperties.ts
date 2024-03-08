import type {
    AgMapShapeSeriesFormatterParams,
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesOptions,
    AgMapShapeSeriesOptionsKeys,
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
    NUMBER_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
    BaseProperties,
    SeriesProperties,
    SeriesTooltip,
} = _ModuleSupport;
const { Label, SceneChangeDetection } = _Scene;

export interface MapShapeNodeLabelDatum extends _Util.PointLabelDatum {
    hasMarkers: boolean;
}

interface BaseMapShapeNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly idValue: string;
    readonly fill: string;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly projectedGeometry: Geometry | undefined;
}

export enum MapShapeNodeDatumType {
    Node,
    Marker,
}

export interface MapShapeNodeDatum extends BaseMapShapeNodeDatum {
    readonly type: MapShapeNodeDatumType.Node;
}

export interface MapShapeNodeMarkerDatum extends BaseMapShapeNodeDatum {
    readonly type: MapShapeNodeDatumType.Marker;
    readonly index: number;
    readonly point: Readonly<_Scene.SizedPoint>;
}

class MapShapeSeriesMarker extends _ModuleSupport.SeriesMarker<AgMapShapeSeriesOptionsKeys, MapShapeNodeMarkerDatum> {
    /**
     * The series `sizeKey` values along with the `size` and `maxSize` configs will be used to
     * determine the size of the marker. All values will be mapped to a marker size within the
     * `[size, maxSize]` range, where the largest values will correspond to the `maxSize` and the
     * lowest to the `size`.
     */
    @Validate(POSITIVE_NUMBER, { optional: true })
    @SceneChangeDetection()
    maxSize: number | undefined;

    @Validate(NUMBER_ARRAY, { optional: true })
    @SceneChangeDetection()
    domain?: [number, number];
}

class MapShapeSeriesLabel extends Label<AgMapShapeSeriesLabelFormatterParams> {
    @Validate(STRING)
    placement: _Util.LabelPlacement = 'bottom';
}

class MapShapeSeriesBackground extends BaseProperties {
    @Validate(GEOJSON_OBJECT, { optional: true })
    topology: FeatureCollection | undefined = undefined;

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

export class MapShapeSeriesProperties extends SeriesProperties<AgMapShapeSeriesOptions> {
    @Validate(GEOJSON_OBJECT, { optional: true })
    topology?: FeatureCollection = undefined;

    @Validate(OBJECT)
    readonly background = new MapShapeSeriesBackground();

    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING)
    idKey: string = '';

    @Validate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeKey?: string;

    @Validate(STRING, { optional: true })
    sizeName?: string;

    @Validate(STRING, { optional: true })
    colorKey?: string;

    @Validate(STRING, { optional: true })
    colorName?: string;

    @Validate(STRING)
    topologyIdKey: string = 'name';

    @Validate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke: string | undefined;

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
    readonly marker = new MapShapeSeriesMarker();

    @Validate(OBJECT)
    readonly label = new MapShapeSeriesLabel();

    @Validate(OBJECT)
    override tooltip = new SeriesTooltip<AgMapShapeSeriesTooltipRendererParams<any>>();

    @Validate(STRING, { optional: true })
    __POLYGON_STROKE?: string = undefined;
    @Validate(OBJECT)
    __POLYGON_LABEL = new Label<AgMapShapeSeriesLabelFormatterParams>();
    @Validate(STRING, { optional: true })
    __LINE_STRING_STROKE?: string = undefined;
    @Validate(OBJECT)
    __MARKER_LABEL = new Label<AgMapShapeSeriesLabelFormatterParams>();
}
