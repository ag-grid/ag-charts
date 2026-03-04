export interface DataType {
    region: string;
    sales: number;
    returns: number;
    profit: number;
}

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

const BASE_VALUES: Record<string, Omit<DataType, 'region'>> = {
    North: { sales: 420, returns: 38, profit: 185 },
    South: { sales: 380, returns: 42, profit: 160 },
    East: { sales: 510, returns: 35, profit: 220 },
    West: { sales: 340, returns: 50, profit: 140 },
    Central: { sales: 460, returns: 30, profit: 200 },
};

export function getInitialData(): DataType[] {
    return REGIONS.map((region) => ({ region, ...BASE_VALUES[region] }));
}

export function applyRandomUpdate(data: DataType[]): DataType[] {
    // Pick 1-2 random regions to update
    const count = 1 + Math.floor(Math.random() * 2);
    const indices = new Set<number>();
    while (indices.size < count) {
        indices.add(Math.floor(Math.random() * data.length));
    }

    return data.map((item, i) => {
        if (!indices.has(i)) return item;

        const vary = (n: number) => Math.max(10, Math.round(n + (Math.random() - 0.5) * n * 0.3));
        return {
            ...item,
            sales: vary(item.sales),
            returns: vary(item.returns),
            profit: vary(item.profit),
        };
    });
}
