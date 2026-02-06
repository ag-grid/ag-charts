export interface DataType {
    year: string;
    publicTransit: number;
    privateCar: number;
    cycle: number;
    other: number;
}

export function getData(): DataType[] {
    return [
        { year: '2020', publicTransit: 120, privateCar: 180, cycle: 60, other: 30 },
        { year: '2021', publicTransit: 140, privateCar: 170, cycle: 75, other: 40 },
        { year: '2022', publicTransit: 160, privateCar: 165, cycle: 90, other: 45 },
        { year: '2023', publicTransit: 175, privateCar: 155, cycle: 110, other: 50 },
        { year: '2024', publicTransit: 190, privateCar: 150, cycle: 130, other: 55 },
    ];
}
