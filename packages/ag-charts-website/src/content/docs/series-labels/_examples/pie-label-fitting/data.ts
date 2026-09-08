export interface DataType {
    source: string;
    terawattHours: number;
    share: number;
}

export function getData(): DataType[] {
    return [
        { source: 'Coal and Lignite', terawattHours: 10350, share: 35 },
        { source: 'Natural Gas', terawattHours: 6650, share: 23 },
        { source: 'Hydroelectric', terawattHours: 4300, share: 15 },
        { source: 'Wind and Solar', terawattHours: 3550, share: 12 },
        { source: 'Nuclear Fission', terawattHours: 2700, share: 9 },
        { source: 'Biomass and Waste', terawattHours: 1750, share: 6 },
    ];
}
