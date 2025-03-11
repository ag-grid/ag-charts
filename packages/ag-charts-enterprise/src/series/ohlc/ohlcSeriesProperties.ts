import type {
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemStylerParams,
    AgCandlestickSeriesTooltipRendererParams,
    AgOhlcSeriesBaseOptions,
    AgOhlcSeriesItemOptions,
    AgOhlcSeriesItemStylerParams,
    AgOhlcSeriesOptions,
    AgOhlcSeriesTooltipRendererParams,
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const {
    BaseProperties,
    Validate,
    AbstractBarSeriesProperties,
    SeriesTooltip,
    STRING,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
} = _ModuleSupport;

class OhlcSeriesItem extends BaseProperties {
    @Validate(COLOR_STRING)
    stroke: string = '#333';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

class OhlcSeriesItems extends BaseProperties {
    @Validate(OBJECT)
    readonly up = new OhlcSeriesItem();

    @Validate(OBJECT)
    readonly down = new OhlcSeriesItem();
}

export abstract class OhlcSeriesBaseProperties<
    T extends AgOhlcSeriesBaseOptions,
> extends AbstractBarSeriesProperties<T> {
    abstract item: Record<
        'up' | 'down',
        FillOptions & StrokeOptions & LineDashOptions & { defaultColorRange?: string[] }
    >;

    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    openKey!: string;

    @Validate(STRING)
    closeKey!: string;

    @Validate(STRING)
    highKey!: string;

    @Validate(STRING)
    lowKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    openName?: string;

    @Validate(STRING, { optional: true })
    closeName?: string;

    @Validate(STRING, { optional: true })
    highName?: string;

    @Validate(STRING, { optional: true })
    lowName?: string;

    abstract override readonly tooltip: _ModuleSupport.SeriesTooltip<
        AgOhlcSeriesTooltipRendererParams<any> & AgCandlestickSeriesTooltipRendererParams<any>
    >;

    abstract itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgOhlcSeriesItemOptions> &
        Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}

export class OhlcSeriesProperties extends OhlcSeriesBaseProperties<AgOhlcSeriesOptions> {
    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgOhlcSeriesTooltipRendererParams<any>>();

    @Validate(OBJECT)
    readonly item = new OhlcSeriesItems();

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgOhlcSeriesItemOptions>;
}
