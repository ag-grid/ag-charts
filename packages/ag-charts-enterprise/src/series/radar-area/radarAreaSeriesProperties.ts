import {
    type AgColorType,
    type AgRadarAreaSeriesOptions,
    type AgRadarAreaSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';

import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { Property } = _ModuleSupport;

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesStyle, AgRadarAreaSeriesOptions> {
    @Property
    fill: AgColorType = 'black';

    @Property
    fillOpacity = 1;
}
