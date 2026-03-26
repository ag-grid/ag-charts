export interface DataType {
    quarter: string;
    software: number;
    hardware: number;
}

const baseValues = [
    { quarter: `Q1'22`, software: 4.35, hardware: 2.14 },
    { quarter: `Q2'22`, software: 4.28, hardware: 3.13 },
    { quarter: `Q3'22`, software: 4.14, hardware: 3.34 },
    { quarter: `Q4'22`, software: 3.48, hardware: 3.56 },
    { quarter: `Q1'23`, software: 3.35, hardware: 3.14 },
];

export function getBaseData(): DataType[] {
    return baseValues.map((d) => ({ ...d }));
}

export function getNegativeData(): DataType[] {
    return baseValues.map((d) => ({
        quarter: d.quarter,
        software: -d.software,
        hardware: -d.hardware,
    }));
}

export function getMixedSignData(): DataType[] {
    return baseValues.map((d, i) => ({
        quarter: d.quarter,
        software: i % 2 === 0 ? d.software : -d.software,
        hardware: i % 2 === 0 ? d.hardware : -d.hardware,
    }));
}
