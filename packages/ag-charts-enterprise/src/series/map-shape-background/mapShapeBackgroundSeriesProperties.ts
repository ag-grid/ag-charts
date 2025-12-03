import type { AgMapShapeBackgroundOptions, AgMapShapeBackgroundThemeableOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';
import { Property } from 'ag-charts-core';

const { SeriesProperties, makeSeriesTooltip } = _ModuleSupport;
export interface MapShapeBackgroundNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly projectedGeometry: _ModuleSupport.Geometry;
    style: AgMapShapeBackgroundThemeableOptions;
}

export class MapShapeBackgroundSeriesProperties extends SeriesProperties<AgMapShapeBackgroundOptions> {
    @Property
    topology?: _ModuleSupport.FeatureCollection = undefined;

    @Property
    fill: InternalAgColorType = 'black';

    @Property
    fillOpacity: number = 1;

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
