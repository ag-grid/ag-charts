const STARTING_PRICE = 185;
const DAILY_VOLATILITY = 0.015;
const DAILY_DRIFT = 0.0001;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

let seed = 42;

function seededRandom() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

function randomNormal() {
    const u1 = seededRandom();
    const u2 = seededRandom();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface Candle {
    date: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

function generateCandle(prevClose: number, date: number): Candle {
    const open = prevClose * (1 + (seededRandom() - 0.5) * 0.002);
    let price = open;
    let high = open;
    let low = open;

    const tickCount = 100;
    const tickVol = DAILY_VOLATILITY / Math.sqrt(tickCount);
    const tickDrift = DAILY_DRIFT / tickCount;

    for (let i = 0; i < tickCount; i++) {
        const change = price * (tickDrift + tickVol * randomNormal());
        price = Math.max(price + change, 1);
        high = Math.max(high, price);
        low = Math.min(low, price);
    }

    return {
        date,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(price.toFixed(2)),
        volume: Math.round(1000000 + seededRandom() * 500000),
    };
}

export function getHistoricalData(days: number): Candle[] {
    const data: Candle[] = [];
    const startTimestamp = Date.UTC(2024, 0, 1);

    let prevClose = STARTING_PRICE;

    for (let i = 0; i < days; i++) {
        const date = startTimestamp + i * MS_PER_DAY;
        const candle = generateCandle(prevClose, date);
        data.push(candle);
        prevClose = candle.close;
    }

    return data;
}

export class PriceSimulator {
    private price: number;
    private readonly tickVolatility: number;
    private readonly tickDrift: number;

    constructor(startPrice: number, ticksPerCandle: number) {
        this.price = startPrice;
        this.tickVolatility = DAILY_VOLATILITY / Math.sqrt(ticksPerCandle);
        this.tickDrift = DAILY_DRIFT / ticksPerCandle;
    }

    tick(): number {
        const change = this.price * (this.tickDrift + this.tickVolatility * randomNormal());
        this.price = Math.max(this.price + change, 1);
        return Number(this.price.toFixed(2));
    }
}
