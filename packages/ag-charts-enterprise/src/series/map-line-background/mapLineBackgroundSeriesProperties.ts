import type { AgMapLineBackgroundOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { GEOJSON_OBJECT } from '../map-util/validation';

const { COLOR_STRING, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, TempValidate, SeriesProperties, SeriesTooltip } =
    _ModuleSupport;

export interface MapLineBackgroundNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly projectedGeometry: _ModuleSupport.Geometry;
}

export class MapLineBackgroundSeriesProperties extends SeriesProperties<AgMapLineBackgroundOptions> {
    @TempValidate(GEOJSON_OBJECT, { optional: true })
    topology?: _ModuleSupport.FeatureCollection = undefined;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<never>();
}
