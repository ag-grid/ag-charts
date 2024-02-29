import type { Feature, FeatureCollection, Position } from 'geojson';

import type {
    AgMapSeriesFormatterParams,
    AgMapSeriesLabelFormatterParams,
    AgMapSeriesOptions,
    AgMapSeriesOptionsKeys,
    AgMapSeriesStyle,
    AgMapSeriesTooltipRendererParams,
} from '../../../options/series/topology/mapOptions';
import { SceneChangeDetection } from '../../../scene/node';
import {
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    NUMBER_ARRAY,
    OBJECT,
    PLAIN_OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';
import type { SeriesNodeDatum } from '../seriesTypes';

export interface MapNodeDatum extends SeriesNodeDatum {
    readonly fill: string;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly feature: Feature | undefined;
}

export interface MapNodeLabelDatum {
    readonly position: Position;
    readonly text: string;
}

export interface MapNodeMarkerDatum extends MapNodeDatum {
    readonly index: number;
    readonly size: number | undefined;
    readonly position: Position;
}

class MapSeriesMarker extends SeriesMarker<AgMapSeriesOptionsKeys, MapNodeMarkerDatum> {
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

export class MapSeriesProperties extends SeriesProperties<AgMapSeriesOptions> {
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

    @Validate(PLAIN_OBJECT)
    topology: FeatureCollection = { type: 'FeatureCollection', features: [] };

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

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgMapSeriesFormatterParams<any>) => AgMapSeriesStyle;

    @Validate(OBJECT)
    readonly marker = new MapSeriesMarker();

    @Validate(OBJECT)
    readonly label = new Label<AgMapSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    override tooltip = new SeriesTooltip<AgMapSeriesTooltipRendererParams<any>>();
}
