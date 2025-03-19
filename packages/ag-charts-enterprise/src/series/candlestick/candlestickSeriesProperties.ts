import type {
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemStylerParams,
    AgCandlestickSeriesTooltipRendererParams,
    AgOhlcSeriesBaseOptions,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

import { OhlcSeriesBaseProperties } from '../ohlc/ohlcSeriesProperties';

const {
    FillGradientDefaults,
    BaseProperties,
    SeriesTooltip,
    TempValidate,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    OR,
} = _ModuleSupport;

class CandlestickSeriesWick extends BaseProperties {
    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth?: number;

    @TempValidate(RATIO)
    strokeOpacity?: number;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset?: number;
}

class CandlestickSeriesItem extends BaseProperties {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING))
    fill: InternalAgColorType = '#c16068';

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(RATIO)
    fillOpacity = 1;

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

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(OBJECT)
    readonly wick = new CandlestickSeriesWick();
}

class CandlestickSeriesItems extends BaseProperties {
    @TempValidate(OBJECT)
    readonly up = new CandlestickSeriesItem();

    @TempValidate(OBJECT)
    readonly down = new CandlestickSeriesItem();
}

export class CandlestickSeriesProperties<T extends AgOhlcSeriesBaseOptions> extends OhlcSeriesBaseProperties<T> {
    @TempValidate(OBJECT)
    readonly item = new CandlestickSeriesItems();

    @TempValidate(OBJECT)
    override readonly tooltip = new SeriesTooltip<AgCandlestickSeriesTooltipRendererParams<any>>();

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}
