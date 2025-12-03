import type { AgMapLineBackgroundOptions, AgMapLineSeriesStyle } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { FeatureCollection, Geometry, Property } from 'ag-charts-core';

const { SeriesProperties, makeSeriesTooltip } = _ModuleSupport;
export interface MapLineBackgroundNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly projectedGeometry: Geometry;
    style: AgMapLineSeriesStyle;
}

export class MapLineBackgroundSeriesProperties extends SeriesProperties<AgMapLineBackgroundOptions> {
    @Property
    topology?: FeatureCollection = undefined;

    @Property
    stroke: string = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 0;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    readonly tooltip = makeSeriesTooltip<never>();
}
