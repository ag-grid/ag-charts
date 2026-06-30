export type DatumType = {
    month: string;
    gain_low: number;
    gain_high: number;
    loss_low: number;
    loss_high: number;
};

export function getData(): DatumType[] {
    return [
        {
            month: 'January',
            gain_low: 1200,
            gain_high: 1500,
            loss_low: 800,
            loss_high: 1100,
        },
        {
            month: 'February',
            gain_low: 1500,
            gain_high: 1650,
            loss_low: 950,
            loss_high: 1450,
        },
        {
            month: 'March',
            gain_low: 1700,
            gain_high: 1920,
            loss_low: 1600,
            loss_high: 1815,
        },
    ];
}
