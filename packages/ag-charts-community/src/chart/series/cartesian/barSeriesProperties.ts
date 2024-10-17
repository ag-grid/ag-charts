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
import {
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    Validate,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesTooltip } from '../seriesTooltip';
import { AbstractBarSeriesProperties } from './abstractBarSeries';

class BarSeriesLabel extends Label<AgBarSeriesLabelFormatterParams> {
    @Validate(
        UNION(
            [
                'inside-center',
                'inside-start',
                'inside-end',
                'outside-start',
                'outside-end',
                // @todo(AG-5950) Deprecate
                { value: 'inside', deprecatedTo: 'inside-center' },
                { value: 'outside', deprecatedTo: 'outside-end' },
            ],
            'a placement'
        )
    )
    placement: AgBarSeriesLabelPlacement = 'inside-center';

    @Validate(NUMBER)
    padding: number = 0;
}

export class BarSeriesProperties extends AbstractBarSeriesProperties<AgBarSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    yFilterKey?: string;

    @Validate(STRING, { optional: true })
    stackGroup?: string;

    @Validate(NUMBER, { optional: true })
    normalizedTo?: number;

    @Validate(COLOR_STRING)
    fill: string = '#c16068';

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = '#874349';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(BOOLEAN, { optional: true })
    crisp?: boolean = undefined;

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgBarSeriesItemStylerParams<unknown>, AgBarSeriesStyle>;

    @Validate(OBJECT, { optional: true })
    readonly shadow = new DropShadow();

    @Validate(OBJECT)
    readonly label = new BarSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBarSeriesTooltipRendererParams>();

    @Validate(BOOLEAN)
    sparklineMode: boolean = false;
}
