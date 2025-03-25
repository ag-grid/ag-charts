import type { InternalAgColorType } from 'ag-charts-core';
import type {
    AgAreaSeriesLabelFormatterParams,
    AgAreaSeriesMarkerItemStylerParams,
    AgAreaSeriesTooltipRendererParams,
    AgSeriesAreaOptions,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { Property } from '../../../util/properties';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { FillGradientDefaults, FillPatternDefaults } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
import { InterpolationProperties } from './interpolationProperties';

export class AreaSeriesProperties extends CartesianSeriesProperties<AgSeriesAreaOptions> {
    @Property
    xKey!: string;

    @Property
    xName?: string = undefined;

    @Property
    yKey!: string;

    @Property
    yName?: string;

    @Property
    yFilterKey: string | undefined;

    @Property
    normalizedTo?: number;

    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    fillOpacity = 1;

    @Property
    stroke: string = '#874349';

    @Property
    strokeWidth = 2;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    interpolation: InterpolationProperties = new InterpolationProperties();

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly marker = new SeriesMarker<AgAreaSeriesMarkerItemStylerParams>();

    @Property
    readonly label = new Label<AgAreaSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = new SeriesTooltip<AgAreaSeriesTooltipRendererParams<any>>();

    @Property
    connectMissingData: boolean = false;
}
