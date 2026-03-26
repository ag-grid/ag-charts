export interface DataType {
    sector: string;
    institutional: number;
    retail: number;
    etfFlows: number;
}

const ALL_SECTORS: DataType[] = [
    { sector: 'Technology', institutional: 850, retail: 320, etfFlows: 180 },
    { sector: 'Healthcare', institutional: 420, retail: 150, etfFlows: 95 },
    { sector: 'Finance', institutional: 680, retail: 240, etfFlows: 150 },
    { sector: 'Energy', institutional: 380, retail: 180, etfFlows: 85 },
    { sector: 'Consumer', institutional: 520, retail: 280, etfFlows: 120 },
    { sector: 'Industrial', institutional: 350, retail: 120, etfFlows: 70 },
    { sector: 'Materials', institutional: 180, retail: 80, etfFlows: 45 },
    { sector: 'Utilities', institutional: 150, retail: 60, etfFlows: 35 },
];

export function getInitialData(): DataType[] {
    return ALL_SECTORS.slice(0, 5).map((d) => ({ ...d }));
}

export function getNextSector(data: DataType[]): DataType | undefined {
    const names = new Set(data.map((d) => d.sector));
    return ALL_SECTORS.find((s) => !names.has(s.sector));
}

export function applyUpdate(data: DataType[]): DataType[] {
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
