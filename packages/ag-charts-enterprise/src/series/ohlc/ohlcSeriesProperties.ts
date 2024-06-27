import type {
    AgCandlestickSeriesItemOptions,
    AgOhlcSeriesItemStylerParams,
    AgOhlcSeriesOptions,
    AgOhlcSeriesStyles,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import {
    type CandlestickSeriesBaseItems,
    CandlestickSeriesProperties,
} from '../candlestick/candlestickSeriesProperties';

const { BaseProperties, Validate, COLOR_STRING, FUNCTION, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO } = _ModuleSupport;

export class OhlcSeriesItem extends BaseProperties {
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

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgOhlcSeriesItemStylerParams<any>, AgOhlcSeriesStyles>;
}

class OhlcSeriesItems extends BaseProperties implements CandlestickSeriesBaseItems<OhlcSeriesItem> {
    @Validate(OBJECT)
    readonly up = new OhlcSeriesItem();

    @Validate(OBJECT)
    readonly down = new OhlcSeriesItem();
}

export class OhlcSeriesProperties extends CandlestickSeriesProperties<AgOhlcSeriesOptions> {
    @Validate(OBJECT)
    override readonly item = new OhlcSeriesItems();

    @Validate(FUNCTION, { optional: true })
    override itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}
