export interface DataType {
    sector: string;
    institutional: number;
    retail: number;
    etfFlows: number;
}

const SECTORS = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial', 'Materials', 'Utilities'];

const BASE_VALUES: Record<string, Omit<DataType, 'sector'>> = {
    Technology: { institutional: 850, retail: 320, etfFlows: 180 },
    Healthcare: { institutional: 420, retail: 150, etfFlows: 95 },
    Finance: { institutional: 680, retail: 240, etfFlows: 150 },
    Energy: { institutional: 380, retail: 180, etfFlows: 85 },
    Consumer: { institutional: 520, retail: 280, etfFlows: 120 },
    Industrial: { institutional: 350, retail: 120, etfFlows: 70 },
    Materials: { institutional: 180, retail: 80, etfFlows: 45 },
    Utilities: { institutional: 150, retail: 60, etfFlows: 35 },
};

export function getInitialData(): DataType[] {
    return SECTORS.map((sector) => ({ sector, ...BASE_VALUES[sector] }));
}

export function applyRandomUpdate(data: DataType[]): DataType[] {
    const count = 1 + Math.floor(Math.random() * 2);
    const indices = new Set<number>();
    while (indices.size < count) {
        indices.add(Math.floor(Math.random() * data.length));
    }

    return data.map((item, i) => {
        if (!indices.has(i)) return item;
        const vary = (n: number) => Math.max(10, Math.round(n + (Math.random() - 0.5) * n * 0.4));
        return {
            ...item,
            institutional: vary(item.institutional),
            retail: vary(item.retail),
            etfFlows: vary(item.etfFlows),
        };
    });
}
