export interface RevenueData {
    quarter: string;
    software: number;
    hardware: number;
    services: number;
}

export function getData(): RevenueData[] {
    return [
        {
            quarter: `Q1'22`,
            software: 4.35,
            hardware: 2.14,
            services: 3.91,
        },
        {
            quarter: `Q2'22`,
            software: 4.28,
            hardware: 3.13,
            services: 3.04,
        },
        {
            quarter: `Q3'22`,
            software: 4.14,
            hardware: 3.34,
            services: 3.18,
        },
        {
            quarter: `Q4'22`,
            software: 3.48,
            hardware: 3.56,
            services: 3.61,
        },
        {
            quarter: `Q1'23`,
            software: 3.85,
            hardware: 3.14,
            services: 3.91,
        },
        {
            quarter: `Q2'23`,
            software: 4.12,
            hardware: 3.43,
            services: 3.54,
        },
        {
            quarter: `Q3'23`,
            software: 4.34,
            hardware: 2.84,
            services: 3.78,
        },
        {
            quarter: `Q4'23`,
            software: 4.48,
            hardware: 2.96,
            services: 4.21,
        },
    ];
}
