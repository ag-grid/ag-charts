import type { AgMapShapeAccessoryOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { GEOJSON_OBJECT } from '../map-util/validation';

// import type { FeatureCollection, Geometry } from 'geojson';
type FeatureCollection = any;
type Geometry = any;

const { COLOR_STRING, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, Validate, SeriesProperties, SeriesTooltip } =
    _ModuleSupport;

export interface MapShapeAccessoryNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly index: number;
    readonly projectedGeometry: Geometry;
}

export class MapShapeAccessorySeriesProperties extends SeriesProperties<AgMapShapeAccessoryOptions> {
    @Validate(GEOJSON_OBJECT, { optional: true })
    topology?: FeatureCollection = undefined;

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

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<never>();
}
