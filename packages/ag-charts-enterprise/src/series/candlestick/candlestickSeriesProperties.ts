import type {
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemStylerParams,
    AgCandlestickSeriesTooltipRendererParams,
    AgOhlcSeriesBaseOptions,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { OhlcSeriesBaseProperties } from '../ohlc/ohlcSeriesProperties';

const { BaseProperties, SeriesTooltip, Validate, COLOR_STRING, FUNCTION, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO } =
    _ModuleSupport;

class CandlestickSeriesWick extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(POSITIVE_NUMBER)
    strokeWidth?: number;

    @Validate(RATIO)
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset?: number;
}

class CandlestickSeriesItem extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    fill: string = '#c16068';

    @Validate(RATIO)
    fillOpacity = 1;

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

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(OBJECT)
    readonly wick = new CandlestickSeriesWick();
}

class CandlestickSeriesItems extends BaseProperties {
    @Validate(OBJECT)
    readonly up = new CandlestickSeriesItem();

    @Validate(OBJECT)
    readonly down = new CandlestickSeriesItem();
}

export class CandlestickSeriesProperties<T extends AgOhlcSeriesBaseOptions> extends OhlcSeriesBaseProperties<T> {
    @Validate(OBJECT)
    readonly item = new CandlestickSeriesItems();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgCandlestickSeriesTooltipRendererParams<any>>();

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}
