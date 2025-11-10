import {
    type AgColorType,
    type AgRadarAreaSeriesOptions,
    type AgRadarAreaSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';

import { Property } from 'ag-charts-core';
import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesStyle, AgRadarAreaSeriesOptions> {
    @Property
    fill: AgColorType = 'black';

    @Property
    fillOpacity = 1;
}
