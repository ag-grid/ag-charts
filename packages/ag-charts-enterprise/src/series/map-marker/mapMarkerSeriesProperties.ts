import type {
    AgMapMarkerSeriesFormatterParams,
    AgMapMarkerSeriesLabelFormatterParams,
    AgMapMarkerSeriesOptions,
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
    NUMBER_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    MARKER_SHAPE,
    Validate,
    SeriesProperties,
    SeriesTooltip,
} = _ModuleSupport;
const { Label, Circle } = _Scene;
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

class MapMarkerSeriesLabel extends Label<AgMapMarkerSeriesLabelFormatterParams> {
    @Validate(STRING)
    placement: _Util.LabelPlacement = 'bottom';
}

export class MapMarkerSeriesProperties extends SeriesProperties<AgMapMarkerSeriesOptions> {
    override isValid(): boolean {
        const superIsValid = super.isValid();

        const hasTopology = this.idKey != null;
        const hasLatLon = this.latitudeKey != null && this.longitudeKey != null;
        if (!hasTopology && !hasLatLon) {
            Logger.warnOnce(
                'Either both [topology] and [idKey] or both [latitudeKey] and [longitudeKey] must be set to render a map marker series.'
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
    latitudeKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    latitudeName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    longitudeKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    longitudeName: string | undefined = undefined;

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

    /** One of the predefined marker names, or a marker constructor function (for user-defined markers). */
    @Validate(MARKER_SHAPE)
    shape: _Scene.MarkerShape = Circle;

    @Validate(POSITIVE_NUMBER)
    size: number = 6;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxSize: number | undefined;

    @Validate(NUMBER_ARRAY, { optional: true })
    sizeDomain?: [number, number];

    @Validate(COLOR_STRING, { optional: true })
    fill?: string;

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgMapMarkerSeriesFormatterParams<any>) => AgMapMarkerSeriesStyle;

    @Validate(OBJECT)
    readonly label = new MapMarkerSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<any>>();
}
