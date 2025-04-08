import { type AgColorType, type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import { RadarSeriesProperties } from '../radar/radarSeriesProperties';

const { FillGradientDefaults, FillPatternDefaults, FillImageDefaults, Property } = _ModuleSupport;

export class RadarAreaSeriesProperties extends RadarSeriesProperties<AgRadarAreaSeriesOptions> {
    @Property
    fill: AgColorType = 'black';

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

    @Property
    fillOpacity = 1;
}
