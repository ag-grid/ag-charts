import type {
    AgRadialGaugeSeriesItemStylerParams,
    AgRadialGaugeSeriesLabelFormatterParams,
    AgRadialGaugeSeriesOptions,
    AgRadialGaugeSeriesStyle,
    AgRadialGaugeSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

import { COLOR_STRING, FUNCTION, NUMBER, OBJECT, Validate } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class RadialGaugeSeriesProperties extends SeriesProperties<AgRadialGaugeSeriesOptions> {
    @Validate(NUMBER)
    value: number = 0;

    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRadialGaugeSeriesItemStylerParams<unknown>, AgRadialGaugeSeriesStyle>;

    @Validate(OBJECT)
    readonly label = new Label<AgRadialGaugeSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRadialGaugeSeriesTooltipRendererParams<any>>();
}
