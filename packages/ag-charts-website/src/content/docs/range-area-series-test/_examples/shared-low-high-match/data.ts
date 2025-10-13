export type DatumType = {
    month: string;
    a_low: number;
    a_high: number;
    b_low: number;
    b_high: number;
    c_low: number;
    c_high: number;
    d_low: number;
    d_high: number;
    e_low: number;
    e_high: number;
};

export function getData(): DatumType[] {
    return [
        {
            month: 'January',
            a_low: 1200,
            a_high: 1500,
            b_low: 800,
            b_high: 1100,
            c_low: 200,
            c_high: 300,
            d_low: 2000,
            d_high: 3000,
            e_low: 3450,
            e_high: 3800,
        },
        {
            month: 'February',
            a_low: 1500,
            a_high: 1650,
            b_low: 950,
            b_high: 1450,
            c_low: 240,
            c_high: 320,
            d_low: 2400,
            d_high: 3200,
            e_low: 3450,
            e_high: 3800,
        },
        {
            month: 'March',
            a_low: 1700,
            a_high: 1920,
            b_low: 1600,
            b_high: 1815,
            c_low: 260,
            c_high: 325,
            d_low: 2600,
            d_high: 3250,
            e_low: 3450,
            e_high: 3800,
        },
    ];
}
