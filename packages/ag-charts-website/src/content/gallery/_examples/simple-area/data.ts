export interface DataType {
    date: Date;
    value: number;
}

export function getData(): DataType[] {
    return [
        { date: new Date('2019-01-01'), value: 2.5 },
        { date: new Date('2019-04-01'), value: 3.4 },
        { date: new Date('2019-07-01'), value: 4.8 },
        { date: new Date('2019-10-01'), value: 2.8 },

        { date: new Date('2020-01-01'), value: -5.5 },
        { date: new Date('2020-04-01'), value: -28.1 }, // COVID
        { date: new Date('2020-07-01'), value: 35.2 }, // rebound
        { date: new Date('2020-10-01'), value: 4.4 },

        { date: new Date('2021-01-01'), value: 5.6 },
        { date: new Date('2021-04-01'), value: 6.4 },
        { date: new Date('2021-07-01'), value: 3.5 },
        { date: new Date('2021-10-01'), value: 7.4 },
    ];
}
