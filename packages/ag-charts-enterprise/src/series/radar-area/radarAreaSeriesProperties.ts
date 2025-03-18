import { type AgColorType, type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { RATIO, COLOR_STRING, TempValidate, OR, COLOR_GRADIENT, COLOR_STRING_ARRAY, COLOR_PATTERN } = _ModuleSupport;

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesOptions> {
    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN))
    fill: AgColorType = 'black';

    @TempValidate(RATIO)
    fillOpacity = 1;
}
