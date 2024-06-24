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
import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { DropShadow, Label } = _Scene;
const {
    AbstractBarSeriesProperties,
    BaseProperties,
    PropertiesArray,
    SeriesTooltip,
    Validate,
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    OBJECT_ARRAY,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
} = _ModuleSupport;

export class WaterfallSeriesTotal extends BaseProperties {
    @Validate(UNION(['subtotal', 'total'], 'a total type'))
    totalType!: 'subtotal' | 'total';

    @Validate(NUMBER)
    index!: number;

    @Validate(STRING)
    axisLabel!: string;
}

class WaterfallSeriesItemTooltip extends BaseProperties {
    @Validate(FUNCTION, { optional: true })
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

class WaterfallSeriesLabel extends Label<AgWaterfallSeriesLabelFormatterParams> {
    @Validate(UNION(['start', 'end', 'inside'], 'a placement'))
    placement: AgWaterfallSeriesLabelPlacement = 'end';

    @Validate(POSITIVE_NUMBER)
    padding: number = 6;
}

export class WaterfallSeriesItem extends BaseProperties {
    @Validate(STRING, { optional: true })
    name?: string;

    @Validate(COLOR_STRING)
    fill: string = '#c16068';

    @Validate(COLOR_STRING)
    stroke: string = '#c16068';

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgWaterfallSeriesItemStylerParams<unknown>, AgWaterfallSeriesStyle>;

    @Validate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @Validate(OBJECT)
    readonly label = new WaterfallSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new WaterfallSeriesItemTooltip();
}

class WaterfallSeriesConnectorLine extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 2;
}

class WaterfallSeriesItems extends BaseProperties {
    @Validate(OBJECT)
    readonly positive = new WaterfallSeriesItem();

    @Validate(OBJECT)
    readonly negative = new WaterfallSeriesItem();

    @Validate(OBJECT)
    readonly total = new WaterfallSeriesItem();
}

export class WaterfallSeriesProperties extends AbstractBarSeriesProperties<AgWaterfallSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(OBJECT)
    readonly item = new WaterfallSeriesItems();

    @Validate(OBJECT_ARRAY)
    readonly totals: WaterfallSeriesTotal[] = new PropertiesArray(WaterfallSeriesTotal);

    @Validate(OBJECT)
    readonly line = new WaterfallSeriesConnectorLine();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgWaterfallSeriesTooltipRendererParams>();
}
