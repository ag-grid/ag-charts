import { type AgColorType, type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { Property } = _ModuleSupport;

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesOptions> {
    @Property
    fill: AgColorType = 'black';

    @Property
    fillOpacity = 1;
}
