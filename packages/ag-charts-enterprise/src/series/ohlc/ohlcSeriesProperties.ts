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
import type { InternalAgGradientColor } from 'ag-charts-core';

const {
    BaseProperties,
    TempValidate,
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
    @TempValidate(COLOR_STRING)
    stroke: string = '#333';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

class OhlcSeriesItems extends BaseProperties {
    @TempValidate(OBJECT)
    readonly up = new OhlcSeriesItem();

    @TempValidate(OBJECT)
    readonly down = new OhlcSeriesItem();
}

export abstract class OhlcSeriesBaseProperties<
    T extends AgOhlcSeriesBaseOptions,
> extends AbstractBarSeriesProperties<T> {
    abstract item: Record<
        'up' | 'down',
        FillOptions & StrokeOptions & LineDashOptions & { fillGradientDefaults?: Required<InternalAgGradientColor> }
    >;

    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    openKey!: string;

    @TempValidate(STRING)
    closeKey!: string;

    @TempValidate(STRING)
    highKey!: string;

    @TempValidate(STRING)
    lowKey!: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    openName?: string;

    @TempValidate(STRING, { optional: true })
    closeName?: string;

    @TempValidate(STRING, { optional: true })
    highName?: string;

    @TempValidate(STRING, { optional: true })
    lowName?: string;

    abstract override readonly tooltip: _ModuleSupport.SeriesTooltip<
        AgOhlcSeriesTooltipRendererParams<any> & AgCandlestickSeriesTooltipRendererParams<any>
    >;

    abstract itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgOhlcSeriesItemOptions> &
        Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}

export class OhlcSeriesProperties extends OhlcSeriesBaseProperties<AgOhlcSeriesOptions> {
    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgOhlcSeriesTooltipRendererParams<any>>();

    @TempValidate(OBJECT)
    readonly item = new OhlcSeriesItems();

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgOhlcSeriesItemOptions>;
}
