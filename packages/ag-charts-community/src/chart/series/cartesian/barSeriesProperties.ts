import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesLabelFormatterParams,
    AgBarSeriesLabelPlacement,
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgBarSeriesTooltipRendererParams,
    AgColorType,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import {
    BOOLEAN,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    OR,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TempValidate,
    UNION,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesTooltip } from '../seriesTooltip';
import { AbstractBarSeriesProperties } from './abstractBarSeries';

class BarSeriesLabel extends Label<AgBarSeriesLabelFormatterParams> {
    @TempValidate(UNION(['inside-center', 'inside-start', 'inside-end', 'outside-start', 'outside-end'], 'a placement'))
    placement: AgBarSeriesLabelPlacement = 'inside-center';

    @TempValidate(NUMBER)
    padding: number = 0;
}

export class BarSeriesProperties extends AbstractBarSeriesProperties<AgBarSeriesOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING)
    yKey!: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    yFilterKey?: string;

    @TempValidate(STRING, { optional: true })
    stackGroup?: string;

    @TempValidate(NUMBER, { optional: true })
    normalizedTo?: number;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill: AgColorType = '#c16068';

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = '#874349';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(BOOLEAN, { optional: true })
    crisp?: boolean = undefined;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgBarSeriesItemStylerParams<unknown>, AgBarSeriesStyle>;

    @TempValidate(OBJECT, { optional: true })
    readonly shadow = new DropShadow();

    @TempValidate(OBJECT)
    readonly label = new BarSeriesLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBarSeriesTooltipRendererParams>();

    @TempValidate(BOOLEAN)
    sparklineMode: boolean = false;

    @TempValidate(BOOLEAN)
    fastDataProcessing: boolean = false;
}
