import type { InternalAgColorType } from 'ag-charts-core';
import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesLabelFormatterParams,
    AgBarSeriesLabelPlacement,
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgBarSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { Property } from '../../../util/properties';
import { Label } from '../../label';
import { FillGradientDefaults, FillImageDefaults, FillPatternDefaults } from '../seriesProperties';
import { makeSeriesTooltip } from '../seriesTooltip';
import { AbstractBarSeriesProperties } from './abstractBarSeries';

class BarSeriesLabel extends Label<AgBarSeriesLabelFormatterParams> {
    @Property
    placement: AgBarSeriesLabelPlacement = 'inside-center';

    @Property
    padding: number = 0;
}

export class BarSeriesProperties extends AbstractBarSeriesProperties<AgBarSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    xName?: string;

    @Property
    yKey!: string;

    @Property
    yName?: string;

    @Property
    yFilterKey?: string;

    @Property
    stackGroup?: string;

    @Property
    normalizedTo?: number;

    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string = '#874349';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    crisp?: boolean = undefined;

    @Property
    itemStyler?: Styler<AgBarSeriesItemStylerParams<unknown>, AgBarSeriesStyle>;

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly label = new BarSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgBarSeriesTooltipRendererParams>();

    @Property
    sparklineMode: boolean = false;

    @Property
    fastDataProcessing: boolean = false;
}
