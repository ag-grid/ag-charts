import type { AgMapLineBackgroundOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const { Property, SeriesProperties, SeriesTooltip } = _ModuleSupport;

export interface MapLineBackgroundNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly projectedGeometry: _ModuleSupport.Geometry;
}

export class MapLineBackgroundSeriesProperties extends SeriesProperties<AgMapLineBackgroundOptions> {
    @Property
    topology?: _ModuleSupport.FeatureCollection = undefined;

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
    readonly tooltip = new SeriesTooltip<never>();
}
