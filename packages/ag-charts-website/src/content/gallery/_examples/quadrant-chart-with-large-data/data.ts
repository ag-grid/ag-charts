export interface Account {
    account: string;
    /** Year-on-year change in product usage, as a percentage. */
    usageChange: number;
    /** Year-on-year change in revenue from the account, as a percentage. */
    revenueChange: number;
}

/** One cluster of accounts, centred away from the pivot so each region carries a distinct group. */
interface Segment {
    count: number;
    usage: { centre: number; spread: number };
    revenue: { centre: number; spread: number };
}

const SEGMENTS: Segment[] = [
    { count: 320, usage: { centre: 18, spread: 15 }, revenue: { centre: 12, spread: 10 } },
    { count: 260, usage: { centre: -16, spread: 14 }, revenue: { centre: -10, spread: 9 } },
    { count: 210, usage: { centre: 15, spread: 13 }, revenue: { centre: -9, spread: 8 } },
    { count: 210, usage: { centre: -14, spread: 13 }, revenue: { centre: 10, spread: 8 } },
];

export function getData(): Account[] {
    // A seeded generator, so the same 1,000 accounts are produced on every run.
    let seed = 20260909;
    const random = () => {
        seed = (seed * 1103515245 + 12345) % 0x80000000;
        return seed / 0x80000000;
    };

    // Averaging three uniform draws clusters values around the centre rather than spreading them evenly.
    const spreadAround = (centre: number, spread: number) => {
        const offset = (random() + random() + random()) / 3 - 0.5;
        return Math.round((centre + offset * spread * 4) * 10) / 10;
    };

    const data: Account[] = [];
    for (const segment of SEGMENTS) {
        for (let i = 0; i < segment.count; i++) {
            data.push({
                account: `AC-${String(data.length + 1).padStart(4, '0')}`,
                usageChange: spreadAround(segment.usage.centre, segment.usage.spread),
                revenueChange: spreadAround(segment.revenue.centre, segment.revenue.spread),
            });
        }
    }

    return data;
}
