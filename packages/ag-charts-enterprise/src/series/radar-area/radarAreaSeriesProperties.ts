import { type AgColorType, type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { FillGradientDefaults, RATIO, COLOR_STRING, TempValidate, OR, COLOR_GRADIENT, COLOR_PATTERN, OBJECT } =
    _ModuleSupport;

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesOptions> {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill: AgColorType = 'black';

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(RATIO)
    fillOpacity = 1;
}
