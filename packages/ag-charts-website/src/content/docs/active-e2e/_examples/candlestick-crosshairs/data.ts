export type TradeDatum = { date: Date; open: number; high: number; low: number; close: number };

export function getData() {
    return [
        { date: new Date('2026-02-10T17:00:00Z'), open: 3715, high: 3740, low: 3702, close: 3727 },
        { date: new Date('2026-02-10T16:00:00Z'), open: 3700, high: 3725, low: 3688, close: 3715 },
        { date: new Date('2026-02-10T15:00:00Z'), open: 3682, high: 3710, low: 3665, close: 3700 },
        { date: new Date('2026-02-10T14:00:00Z'), open: 3695, high: 3712, low: 3660, close: 3682 },
        { date: new Date('2026-02-10T13:00:00Z'), open: 3710, high: 3728, low: 3685, close: 3695 },
        { date: new Date('2026-02-10T12:00:00Z'), open: 3728, high: 3745, low: 3690, close: 3710 },
        { date: new Date('2026-02-10T11:00:00Z'), open: 3742, high: 3758, low: 3715, close: 3728 },
        { date: new Date('2026-02-10T10:00:00Z'), open: 3720, high: 3755, low: 3705, close: 3742 },
        { date: new Date('2026-02-10T09:00:00Z'), open: 3698, high: 3730, low: 3680, close: 3720 },
        { date: new Date('2026-02-10T08:00:00Z'), open: 3675, high: 3710, low: 3660, close: 3698 },
        { date: new Date('2026-02-10T07:00:00Z'), open: 3658, high: 3690, low: 3640, close: 3675 },
        { date: new Date('2026-02-10T06:00:00Z'), open: 3665, high: 3682, low: 3638, close: 3658 },
        { date: new Date('2026-02-10T05:00:00Z'), open: 3680, high: 3698, low: 3650, close: 3665 },
        { date: new Date('2026-02-10T04:00:00Z'), open: 3645, high: 3690, low: 3625, close: 3680 },
        { date: new Date('2026-02-10T03:00:00Z'), open: 3628, high: 3660, low: 3605, close: 3645 },
        { date: new Date('2026-02-10T02:00:00Z'), open: 3655, high: 3675, low: 3610, close: 3628 },
        { date: new Date('2026-02-10T01:00:00Z'), open: 3688, high: 3700, low: 3640, close: 3655 },
        { date: new Date('2026-02-10T00:00:00Z'), open: 3715, high: 3730, low: 3670, close: 3688 },
        { date: new Date('2026-02-09T23:00:00Z'), open: 3730, high: 3750, low: 3695, close: 3715 },
        { date: new Date('2026-02-09T22:00:00Z'), open: 3748, high: 3765, low: 3712, close: 3730 },
        { date: new Date('2026-02-09T21:00:00Z'), open: 3722, high: 3760, low: 3708, close: 3748 },
        { date: new Date('2026-02-09T20:00:00Z'), open: 3705, high: 3735, low: 3680, close: 3722 },
        { date: new Date('2026-02-09T19:00:00Z'), open: 3692, high: 3715, low: 3668, close: 3705 },
        { date: new Date('2026-02-09T18:00:00Z'), open: 3710, high: 3725, low: 3685, close: 3692 },
    ];
}
