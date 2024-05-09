import type {
    AgOhlcSeriesFormatterParams,
    AgOhlcSeriesItemOptions,
    AgOhlcSeriesOptions,
    AgOhlcSeriesStyles,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

import {
    type CandlestickSeriesBaseItems,
    CandlestickSeriesBaseProperties,
} from '../candlestick/candlestickSeriesProperties';
import type { OhlcNodeDatum } from './ohlcTypes';

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
    formatter?: (params: AgOhlcSeriesFormatterParams<any>) => AgOhlcSeriesStyles;
}

class OhlcSeriesItems extends BaseProperties implements CandlestickSeriesBaseItems<OhlcSeriesItem> {
    @Validate(OBJECT)
    readonly up = new OhlcSeriesItem();

    @Validate(OBJECT)
    readonly down = new OhlcSeriesItem();
}

export class OhlcSeriesProperties extends CandlestickSeriesBaseProperties<
    AgOhlcSeriesOptions,
    AgOhlcSeriesItemOptions,
    OhlcSeriesItems,
    AgOhlcSeriesFormatterParams<OhlcNodeDatum>
> {
    constructor() {
        super(new OhlcSeriesItems());
    }
}
