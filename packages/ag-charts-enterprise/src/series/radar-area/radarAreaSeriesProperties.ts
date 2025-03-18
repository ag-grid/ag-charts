import {
    type AgColorType,
    type AgGradientColor,
    type AgRadarAreaSeriesOptions,
    _ModuleSupport,
} from 'ag-charts-community';

import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { RATIO, COLOR_STRING, TempValidate, OR, COLOR_GRADIENT } = _ModuleSupport;

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesOptions> {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING))
    fill: AgColorType = 'black';

    @TempValidate(COLOR_GRADIENT)
    fillGradientDefaults!: Required<AgGradientColor>;

    @TempValidate(RATIO)
    fillOpacity = 1;
}
