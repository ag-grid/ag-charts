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

// Seeded random for reproducible data
let seed = 42;

function random(): number {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

function gaussianRandom(): number {
    const u1 = random();
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// State for market-like behavior
let currentValue = 50;
let currentValue2 = 50;
let trend = 0;
let trend2 = 0;
let volatility = 0.5;

// Regime states for realistic patterns
let regimeCounter = 0;
let currentRegime: 'calm' | 'trending' | 'volatile' = 'calm';
const REGIME_DURATION_MIN = 200;
const REGIME_DURATION_MAX = 800;
let nextRegimeChange = REGIME_DURATION_MIN + random() * (REGIME_DURATION_MAX - REGIME_DURATION_MIN);

function updateRegime(): void {
    regimeCounter++;
    if (regimeCounter >= nextRegimeChange) {
        regimeCounter = 0;
        nextRegimeChange = REGIME_DURATION_MIN + random() * (REGIME_DURATION_MAX - REGIME_DURATION_MIN);

        const regimes: Array<'calm' | 'trending' | 'volatile'> = ['calm', 'trending', 'volatile'];
        currentRegime = regimes[Math.floor(random() * regimes.length)];

        switch (currentRegime) {
            case 'calm':
                volatility = 0.2 + random() * 0.2;
                trend = (random() - 0.5) * 0.05;
                trend2 = (random() - 0.5) * 0.04;
                break;
            case 'trending':
                volatility = 0.3 + random() * 0.3;
                trend = (random() - 0.5) * 0.15;
                trend2 = (random() - 0.5) * 0.12;
                break;
            case 'volatile':
                volatility = 0.8 + random() * 0.8;
                trend = (random() - 0.5) * 0.08;
                trend2 = (random() - 0.5) * 0.06;
                break;
        }
    }
}

function generateValueDatum(index: number, includeValue2: boolean = false): ValueDatum {
    updateRegime();

    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

    // Multi-frequency oscillation
    const slowCycle = Math.sin(index * 0.005) * 8;
    const mediumCycle = Math.sin(index * 0.023) * 4;
    const fastCycle = Math.sin(index * 0.071) * 1.5;

    // Random walk with mean reversion
    const meanReversion = (50 - currentValue) * 0.002;
    const noise = gaussianRandom() * volatility;

    // Occasional spikes
    let spike = 0;
    if (random() < 0.003) {
        spike = (random() > 0.5 ? 1 : -1) * (3 + random() * 5);
    }

    currentValue += trend + meanReversion + noise + spike;
    currentValue = Math.max(15, Math.min(85, currentValue));

    const finalValue = currentValue + slowCycle + mediumCycle + fastCycle;

    const datum: ValueDatum = {
        timestamp,
        value: Number(Math.max(0, Math.min(100, finalValue)).toFixed(2)),
    };

    if (includeValue2) {
        const meanReversion2 = (50 - currentValue2) * 0.002;
        const noise2 = gaussianRandom() * volatility * 0.8;
        currentValue2 += trend2 + meanReversion2 + noise2;
        currentValue2 = Math.max(15, Math.min(85, currentValue2));

        const slowCycle2 = Math.cos(index * 0.004) * 6;
        const mediumCycle2 = Math.cos(index * 0.019) * 3;

        datum.value2 = Number(Math.max(0, Math.min(100, currentValue2 + slowCycle2 + mediumCycle2)).toFixed(2));
    }

    return datum;
}

function generateOhlcDatum(index: number, previousClose?: number): { datum: OhlcDatum; basePrice: number } {
    updateRegime();

    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

    // Use the value generation for mid price
    const slowCycle = Math.sin(index * 0.005) * 8;
    const mediumCycle = Math.sin(index * 0.023) * 4;

    const meanReversion = (50 - currentValue) * 0.002;
    const noise = gaussianRandom() * volatility;

    currentValue += trend + meanReversion + noise;
    currentValue = Math.max(15, Math.min(85, currentValue));

    const midPrice = currentValue + slowCycle + mediumCycle;

    const open = previousClose ?? midPrice;
    const closeOffset = gaussianRandom() * volatility * 0.3;
    const close = Math.max(0, Math.min(100, midPrice + closeOffset));

    const range = volatility * (0.5 + random() * 1);
    const high = Math.min(100, Math.max(open, close) + range);
    const low = Math.max(0, Math.min(open, close) - range);

    return {
        datum: {
            timestamp,
            open: Number(Math.max(0, Math.min(100, open)).toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
        },
        basePrice: close,
    };
}

function generateRangeDatum(index: number): RangeDatum {
    updateRegime();

    const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;

    const slowCycle = Math.sin(index * 0.005) * 8;
    const mediumCycle = Math.sin(index * 0.023) * 4;

    const meanReversion = (50 - currentValue) * 0.002;
    const noise = gaussianRandom() * volatility;

    currentValue += trend + meanReversion + noise;
    currentValue = Math.max(15, Math.min(85, currentValue));

    const midValue = currentValue + slowCycle + mediumCycle;
    const range = 5 + volatility * (2 + random() * 5);

    return {
        timestamp,
        low: Number(Math.max(0, midValue - range / 2).toFixed(2)),
        high: Number(Math.min(100, midValue + range / 2).toFixed(2)),
    };
}

export function resetGenerator(): void {
    seed = 42;
    currentValue = 50;
    currentValue2 = 50;
    trend = 0;
    trend2 = 0;
    volatility = 0.5;
    regimeCounter = 0;
    currentRegime = 'calm';
    nextRegimeChange = REGIME_DURATION_MIN + random() * (REGIME_DURATION_MAX - REGIME_DURATION_MIN);
}

export function createSeedData(count: number, seriesType: SeriesType): { data: Datum[]; lastBasePrice?: number } {
    resetGenerator();

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

export function generateBatch(
    startIndex: number,
    count: number,
    seriesType: SeriesType,
    previousClose?: number
): { data: Datum[]; lastBasePrice?: number } {
    const result: Datum[] = [];
    let basePrice = previousClose;

    for (let i = 0; i < count; i++) {
        const { datum, lastBasePrice } = generateNextDatum(startIndex + i, seriesType, basePrice);
        result.push(datum);
        basePrice = lastBasePrice;
    }

    return { data: result, lastBasePrice: basePrice };
}
