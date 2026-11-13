export function getData() {
    return ['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, i) => ({
        quarter,
        solid: 100 + i * 10,
        dot: 90 + i * 10,
        dash: 80 + i * 10,
        dashDot: 70 + i * 10,
        longDash: 60 + i * 10,
        longDashDot: 50 + i * 10,
        longDashDotDot: 40 + i * 10,
        dashDotDot: 30 + i * 10,
        dashLongDash: 20 + i * 10,
        longDashDashDash: 10 + i * 10,
    }));
}
