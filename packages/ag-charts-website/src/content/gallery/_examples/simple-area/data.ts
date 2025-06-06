export interface DataType {
    date: Date;
    activeUsers: number;
    newSignups: number;
    revenue: number;
}

export function getData(): DataType[] {
    return [
        {
            date: new Date('2025-05-01'),
            activeUsers: 1200,
            newSignups: 45,
            revenue: 340,
        },
        {
            date: new Date('2025-05-02'),
            activeUsers: 1350,
            newSignups: 60,
            revenue: 410,
        },
        {
            date: new Date('2025-05-03'),
            activeUsers: 1280,
            newSignups: 50,
            revenue: 390,
        },
        {
            date: new Date('2025-05-04'),
            activeUsers: 1400,
            newSignups: 65,
            revenue: 430,
        },
        {
            date: new Date('2025-05-05'),
            activeUsers: 1500,
            newSignups: 75,
            revenue: 470,
        },
        {
            date: new Date('2025-05-06'),
            activeUsers: 1600,
            newSignups: 70,
            revenue: 490,
        },
        {
            date: new Date('2025-05-07'),
            activeUsers: 1580,
            newSignups: 68,
            revenue: 480,
        },
        {
            date: new Date('2025-05-08'),
            activeUsers: 1620,
            newSignups: 72,
            revenue: 500,
        },
        {
            date: new Date('2025-05-09'),
            activeUsers: 1700,
            newSignups: 80,
            revenue: 530,
        },
        {
            date: new Date('2025-05-10'),
            activeUsers: 1680,
            newSignups: 78,
            revenue: 520,
        },
        {
            date: new Date('2025-05-11'),
            activeUsers: 1720,
            newSignups: 85,
            revenue: 550,
        },
        {
            date: new Date('2025-05-12'),
            activeUsers: 1800,
            newSignups: 90,
            revenue: 580,
        },
        {
            date: new Date('2025-05-13'),
            activeUsers: 1850,
            newSignups: 95,
            revenue: 600,
        },
        {
            date: new Date('2025-05-14'),
            activeUsers: 1900,
            newSignups: 100,
            revenue: 630,
        },
    ];
}
