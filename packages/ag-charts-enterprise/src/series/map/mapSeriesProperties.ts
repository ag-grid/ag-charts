import type { FeatureCollection, Geometry } from 'geojson';

import type {
    AgMapSeriesFormatterParams,
    AgMapSeriesLabelFormatterParams,
    AgMapSeriesOptions,
    AgMapSeriesOptionsKeys,
    AgMapSeriesStyle,
    AgMapSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const {
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER_ARRAY,
    OBJECT,
    PLAIN_OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
    BaseProperties,
    SeriesProperties,
    SeriesTooltip,
} = _ModuleSupport;
const { Label, SceneChangeDetection } = _Scene;

export interface MapNodeLabelDatum extends _Util.PointLabelDatum {}

interface BaseMapNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly idValue: string;
    readonly label: MapNodeLabelDatum | undefined;
    readonly fill: string;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly projectedGeometry: Geometry | undefined;
}

export enum MapNodeDatumType {
    Node,
    Marker,
}

export interface MapNodeDatum extends BaseMapNodeDatum {
    readonly type: MapNodeDatumType.Node;
}

export interface MapNodeMarkerDatum extends BaseMapNodeDatum {
    readonly type: MapNodeDatumType.Marker;
    readonly index: number;
    readonly point: Readonly<_Scene.SizedPoint>;
}

class MapSeriesMarker extends _ModuleSupport.SeriesMarker<AgMapSeriesOptionsKeys, MapNodeMarkerDatum> {
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

class MapSeriesBackground extends BaseProperties {
    @Validate(PLAIN_OBJECT)
    topology: FeatureCollection = { type: 'FeatureCollection', features: [] };

    @Validate(STRING, { optional: true })
    id: string | undefined = undefined;

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

export class MapSeriesProperties extends SeriesProperties<AgMapSeriesOptions> {
    @Validate(PLAIN_OBJECT)
    topology: FeatureCollection = { type: 'FeatureCollection', features: [] };

    @Validate(OBJECT)
    readonly background = new MapSeriesBackground();

    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING)
    idKey: string = '';

    @Validate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeKey?: string;

    @Validate(STRING, { optional: true })
    sizeName?: string;

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
    formatter?: (params: AgMapSeriesFormatterParams<any>) => AgMapSeriesStyle;

    @Validate(OBJECT)
    readonly marker = new MapSeriesMarker();

    @Validate(OBJECT)
    readonly label = new Label<AgMapSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    override tooltip = new SeriesTooltip<AgMapSeriesTooltipRendererParams<any>>();

    @Validate(STRING, { optional: true })
    __POLYGON_STROKE?: string = undefined;

    @Validate(STRING, { optional: true })
    __LINE_STRING_STROKE?: string = undefined;
}
