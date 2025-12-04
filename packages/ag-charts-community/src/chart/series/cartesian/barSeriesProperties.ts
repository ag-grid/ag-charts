import type { InternalAgColorType } from 'ag-charts-core';
import { Property } from 'ag-charts-core';
import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesLabelFormatterParams,
    AgBarSeriesLabelPlacement,
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgBarSeriesStylerParams,
    AgBarSeriesTooltipRendererParams,
    PixelSize,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { Label } from '../../label';
import { makeSeriesTooltip } from '../seriesTooltip';
import { AbstractBarSeriesProperties } from './abstractBarSeries';

class BarSeriesLabel extends Label<AgBarSeriesLabelFormatterParams> {
    @Property
    placement: AgBarSeriesLabelPlacement = 'inside-center';

    @Property
    spacing: PixelSize = 0;
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
    styler?: Styler<AgBarSeriesStylerParams<unknown, unknown>, AgBarSeriesStyle>;

    @Property
    itemStyler?: Styler<AgBarSeriesItemStylerParams<unknown>, AgBarSeriesStyle>;

    @Property
    simpleItemStyler?: (datum: unknown) => AgBarSeriesStyle | undefined;

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly label = new BarSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgBarSeriesTooltipRendererParams>();

    @Property
    sparklineMode: boolean = false;
}
