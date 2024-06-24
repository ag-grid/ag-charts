import type {
    AgRangeBarSeriesItemStylerParams,
    AgRangeBarSeriesLabelFormatterParams,
    AgRangeBarSeriesLabelPlacement,
    AgRangeBarSeriesOptions,
    AgRangeBarSeriesStyles,
    AgRangeBarSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { DropShadow, Label } = _Scene;
const {
    AbstractBarSeriesProperties,
    SeriesTooltip,
    Validate,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    PLACEMENT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class RangeBarSeriesLabel extends Label<AgRangeBarSeriesLabelFormatterParams> {
    @Validate(PLACEMENT)
    placement: AgRangeBarSeriesLabelPlacement = 'inside';

    @Validate(POSITIVE_NUMBER)
    padding: number = 6;
}

export class RangeBarProperties extends AbstractBarSeriesProperties<AgRangeBarSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yLowKey!: string;

    @Validate(STRING)
    yHighKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    yLowName?: string;

    @Validate(STRING, { optional: true })
    yHighName?: string;

    @Validate(COLOR_STRING)
    fill: string = '#99CCFF';

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = '#99CCFF';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRangeBarSeriesItemStylerParams<unknown>, AgRangeBarSeriesStyles>;

    @Validate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @Validate(OBJECT)
    readonly label = new RangeBarSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRangeBarSeriesTooltipRendererParams>();
}
