import type {
    AgTooltipRendererResult,
    AgWaterfallSeriesItemStylerParams,
    AgWaterfallSeriesLabelFormatterParams,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesStyle,
    AgWaterfallSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

const {
    AbstractBarSeriesProperties,
    BaseProperties,
    FillGradientDefaults,
    FillPatternDefaults,
    PropertiesArray,
    SeriesTooltip,
    TempValidate,
    BOOLEAN,
    COLOR_STRING,
    COLOR_PATTERN,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    OBJECT_ARRAY,
    POSITIVE_NUMBER,
    OR,
    COLOR_GRADIENT,
    RATIO,
    STRING,
    UNION,
    DropShadow,
    Label,
} = _ModuleSupport;

export class WaterfallSeriesTotal extends BaseProperties {
    @TempValidate(UNION(['subtotal', 'total'], 'a total type'))
    totalType!: 'subtotal' | 'total';

    @TempValidate(NUMBER)
    index!: number;

    @TempValidate(STRING)
    axisLabel!: string;
}

class WaterfallSeriesItemTooltip extends BaseProperties {
    @TempValidate(FUNCTION, { optional: true })
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

class WaterfallSeriesLabel extends Label<AgWaterfallSeriesLabelFormatterParams> {
    @TempValidate(UNION(['inside-center', 'inside-start', 'inside-end', 'outside-start', 'outside-end'], 'a placement'))
    placement: AgWaterfallSeriesLabelPlacement = 'outside-end';

    @TempValidate(POSITIVE_NUMBER)
    padding: number = 6;
}

export class WaterfallSeriesItem extends BaseProperties {
    @TempValidate(STRING, { optional: true })
    name?: string;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN))
    fill: InternalAgColorType = '#c16068';

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(OBJECT)
    readonly fillPatternDefaults = new FillPatternDefaults();

    @TempValidate(COLOR_STRING)
    stroke: string = '#c16068';

    @TempValidate(RATIO)
    fillOpacity = 1;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgWaterfallSeriesItemStylerParams<unknown>, AgWaterfallSeriesStyle>;

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @TempValidate(OBJECT)
    readonly label = new WaterfallSeriesLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new WaterfallSeriesItemTooltip();
}

class WaterfallSeriesConnectorLine extends BaseProperties {
    @TempValidate(BOOLEAN)
    enabled: boolean = true;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 2;
}

class WaterfallSeriesItems extends BaseProperties {
    @TempValidate(OBJECT)
    readonly positive = new WaterfallSeriesItem();

    @TempValidate(OBJECT)
    readonly negative = new WaterfallSeriesItem();

    @TempValidate(OBJECT)
    readonly total = new WaterfallSeriesItem();
}

export class WaterfallSeriesProperties extends AbstractBarSeriesProperties<AgWaterfallSeriesOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    yKey!: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(OBJECT)
    readonly item = new WaterfallSeriesItems();

    @TempValidate(OBJECT_ARRAY)
    readonly totals: WaterfallSeriesTotal[] = new PropertiesArray(WaterfallSeriesTotal);

    @TempValidate(OBJECT)
    readonly line = new WaterfallSeriesConnectorLine();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgWaterfallSeriesTooltipRendererParams>();
}
