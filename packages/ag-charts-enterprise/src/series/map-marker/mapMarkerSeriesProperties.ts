import type { FeatureCollection } from 'geojson';

import type {
    AgMapMarkerSeriesFormatterParams,
    AgMapMarkerSeriesLabelFormatterParams,
    AgMapMarkerSeriesOptions,
    AgMapMarkerSeriesOptionsKeys,
    AgMapMarkerSeriesStyle,
    AgMapMarkerSeriesTooltipRendererParams,
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

export interface MapMarkerNodeLabelDatum extends _Util.PointLabelDatum {}

export interface MapMarkerNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label: MapMarkerNodeLabelDatum | undefined;
    readonly fill: string | undefined;
    readonly lonValue: number;
    readonly latValue: number;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly point: Readonly<_Scene.SizedPoint>;
}

class MapMarkerSeriesMarker extends _ModuleSupport.SeriesMarker<AgMapMarkerSeriesOptionsKeys, MapMarkerNodeDatum> {
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

class MapMarkerSeriesBackground extends BaseProperties {
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

export class MapMarkerSeriesProperties extends SeriesProperties<AgMapMarkerSeriesOptions> {
    @Validate(OBJECT)
    readonly background = new MapMarkerSeriesBackground();

    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING)
    latKey: string = '';

    @Validate(STRING)
    lonKey: string = '';

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

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgMapMarkerSeriesFormatterParams<any>) => AgMapMarkerSeriesStyle;

    @Validate(OBJECT)
    readonly marker = new MapMarkerSeriesMarker();

    @Validate(OBJECT)
    readonly label = new Label<AgMapMarkerSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    override tooltip = new SeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<any>>();
}
