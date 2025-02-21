import { type AgFillType, type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { RATIO, COLOR_STRING, Validate, OR, COLOR_GRADIENT, COLOR_STRING_ARRAY } = _ModuleSupport;

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesOptions> {
    @Validate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @Validate(OR(COLOR_GRADIENT, COLOR_STRING))
    fill: AgFillType = 'black';

    @Validate(RATIO)
    fillOpacity = 1;
}
