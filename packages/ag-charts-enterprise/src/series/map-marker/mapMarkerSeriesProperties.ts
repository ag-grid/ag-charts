import type {
    AgMapMarkerSeriesFormatterParams,
    AgMapMarkerSeriesLabelFormatterParams,
    AgMapMarkerSeriesOptions,
    AgMapMarkerSeriesOptionsKeys,
    AgMapMarkerSeriesStyle,
    AgMapMarkerSeriesTooltipRendererParams,
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
    BaseProperties,
    SeriesProperties,
    SeriesTooltip,
} = _ModuleSupport;
const { Label, SceneChangeDetection } = _Scene;
const { Logger } = _Util;

export interface MapMarkerNodeLabelDatum extends _Util.PointLabelDatum {}

export interface MapMarkerNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly index: number;
    readonly fill: string | undefined;
    readonly idValue: string | undefined;
    readonly lonValue: number | undefined;
    readonly latValue: number | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly projectedGeometry: _ModuleSupport.Geometry | undefined;
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

class MapMarkerSeriesLabel extends Label<AgMapMarkerSeriesLabelFormatterParams> {
    @Validate(STRING)
    placement: _Util.LabelPlacement = 'bottom';
}

class MapMarkerSeriesBackground extends BaseProperties {
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

export class MapMarkerSeriesProperties extends SeriesProperties<AgMapMarkerSeriesOptions> {
    override isValid(): boolean {
        const superIsValid = super.isValid();

        const hasTopology = this.idKey != null;
        const hasLatLon = this.latKey != null && this.lonKey != null;
        if (!hasTopology && !hasLatLon) {
            Logger.warnOnce(
                'Either both [topology] and [idKey] or both [latKey] and [lonKey] must be set to render a map marker series.'
            );

            return false;
        }

        return superIsValid;
    }

    @Validate(GEOJSON_OBJECT, { optional: true })
    topology: _ModuleSupport.FeatureCollection | undefined = undefined;

    @Validate(STRING, { optional: true })
    legendItemName?: string;

    @Validate(STRING, { optional: true })
    idKey: string | undefined = undefined;

    @Validate(STRING)
    topologyIdKey: string = 'name';

    @Validate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    latKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    latName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    lonKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    lonName: string | undefined = undefined;

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

    @Validate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })), { optional: true })
    colorRange: string[] | undefined = undefined;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgMapMarkerSeriesFormatterParams<any>) => AgMapMarkerSeriesStyle;

    @Validate(OBJECT)
    readonly background = new MapMarkerSeriesBackground();

    @Validate(OBJECT)
    readonly marker = new MapMarkerSeriesMarker();

    @Validate(OBJECT)
    readonly label = new MapMarkerSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<any>>();
}
