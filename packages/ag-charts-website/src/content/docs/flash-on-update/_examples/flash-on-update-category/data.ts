export interface DataType {
    ticker: string;
    buyVolume: number;
    sellVolume: number;
}

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX', 'AMD', 'CRM'];

const BASE_VALUES: Record<string, Omit<DataType, 'ticker'>> = {
    AAPL: { buyVolume: 28, sellVolume: 24 },
    MSFT: { buyVolume: 18, sellVolume: 15 },
    GOOGL: { buyVolume: 12, sellVolume: 10 },
    AMZN: { buyVolume: 22, sellVolume: 19 },
    NVDA: { buyVolume: 35, sellVolume: 30 },
    META: { buyVolume: 15, sellVolume: 12 },
    TSLA: { buyVolume: 42, sellVolume: 38 },
    NFLX: { buyVolume: 8, sellVolume: 6 },
    AMD: { buyVolume: 25, sellVolume: 22 },
    CRM: { buyVolume: 5, sellVolume: 4 },
};

let seed = NaN;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

export function getInitialData(): DataType[] {
    seed = 1234;
    return TICKERS.map((ticker) => {
        const base = BASE_VALUES[ticker];
        const vary = (n: number) => Math.max(1, Math.round(n + (random() - 0.5) * n * 0.3));
        return { ticker, buyVolume: vary(base.buyVolume), sellVolume: vary(base.sellVolume) };
    });
}

export function applyRandomUpdate(data: DataType[]): DataType[] {
    const count = 1 + Math.floor(random() * 3);
    const indices = new Set<number>();
    while (indices.size < count) {
        indices.add(Math.floor(random() * data.length));
    }

    return data.map((item, i) => {
        if (!indices.has(i)) return item;
        const vary = (n: number) => Math.max(1, Math.round(n + (random() - 0.5) * n * 0.3));
        return { ...item, buyVolume: vary(item.buyVolume), sellVolume: vary(item.sellVolume) };
    });
}
