export interface DataType {
    segment: string;
    revenue: number;
}

export function getData(): DataType[] {
    return [
        { segment: 'Cloud Services', revenue: 42500 },
        { segment: 'Enterprise Software', revenue: 31200 },
        { segment: 'Cybersecurity', revenue: 28900 },
        { segment: 'Data Analytics', revenue: 19800 },
        { segment: 'AI & Machine Learning', revenue: 15600 },
        { segment: 'IoT Solutions', revenue: 8400 },
    ];
}
