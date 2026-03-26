const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

export type SeriesType =
    | 'line'
    | 'area'
    | 'bar'
    | 'stacked-bar'
    | 'stacked-area'
    | 'range-area'
    | 'range-bar'
    | 'candlestick'
    | 'ohlc';

export type ValueDatum = {
    timestamp: number;
    value: number;
    value2?: number;
};

export type OhlcDatum = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
};

export type RangeDatum = {
    timestamp: number;
    low: number;
    high: number;
};

export type Datum = ValueDatum | OhlcDatum | RangeDatum;

function generateValueDatum(index: number, includeValue2: boolean = false): ValueDatum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1000 + index * 0.02;
    const datum: ValueDatum = {
        timestamp,
        value: Number((baseline + trend + volatility).toFixed(2)),
    };
    if (includeValue2) {
        const trend2 = Math.cos(index / 200) * 30 + Math.sin(index / 60) * 20;
        datum.value2 = Number((baseline + trend2 + volatility * 0.8).toFixed(2));
    }
    return datum;
}

function generateOhlcDatum(index: number, previousClose?: number): { datum: OhlcDatum; basePrice: number } {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1000 + index * 0.02;
    const midPrice = baseline + trend + volatility;

    const open = previousClose ?? midPrice;
    const closeOffset = Math.sin(index / 7) * 2 + Math.cos(index / 11) * 1.5;
    const close = Number((midPrice + closeOffset).toFixed(2));

    const range = 2 + Math.abs(Math.sin(index / 13)) * 3;
    const high = Number((Math.max(open, close) + range).toFixed(2));
    const low = Number((Math.min(open, close) - range).toFixed(2));

    return {
        datum: {
            timestamp,
            open: Number(open.toFixed(2)),
            high,
            low,
            close,
        },
        basePrice: close,
    };
}

function generateRangeDatum(index: number): RangeDatum {
    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
    const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
    const volatility = Math.sin(index / 15) * 5;
    const baseline = 1000 + index * 0.02;
    const midValue = baseline + trend + volatility;
    const range = 10 + Math.abs(Math.sin(index / 30)) * 20;
    return {
        timestamp,
        low: Number((midValue - range / 2).toFixed(2)),
        high: Number((midValue + range / 2).toFixed(2)),
    };
}

export function createSeedData(count: number, seriesType: SeriesType): { data: Datum[]; lastBasePrice?: number } {
    const result: Datum[] = [];
    let basePrice: number | undefined = undefined;
    const isStacked = seriesType === 'stacked-bar' || seriesType === 'stacked-area';
    const isRange = seriesType === 'range-area' || seriesType === 'range-bar';

    for (let i = 0; i < count; i++) {
        if (seriesType === 'ohlc' || seriesType === 'candlestick') {
            const { datum, basePrice: newBasePrice } = generateOhlcDatum(i, basePrice);
            result.push(datum);
            basePrice = newBasePrice;
        } else if (isRange) {
            result.push(generateRangeDatum(i));
        } else {
            result.push(generateValueDatum(i, isStacked));
        }
    }
    return { data: result, lastBasePrice: basePrice };
}

export function generateNextDatum(
    index: number,
    seriesType: SeriesType,
    previousClose?: number
): { datum: Datum; lastBasePrice?: number } {
    const isStacked = seriesType === 'stacked-bar' || seriesType === 'stacked-area';
    const isRange = seriesType === 'range-area' || seriesType === 'range-bar';

    if (seriesType === 'ohlc' || seriesType === 'candlestick') {
        const { datum, basePrice } = generateOhlcDatum(index, previousClose);
        return { datum, lastBasePrice: basePrice };
    } else if (isRange) {
        return { datum: generateRangeDatum(index), lastBasePrice: undefined };
    } else {
        return { datum: generateValueDatum(index, isStacked), lastBasePrice: undefined };
    }
}
