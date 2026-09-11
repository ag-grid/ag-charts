export const DATA_MARKET_SHARE = [
    { os: 'Android', share: 56.9, satisfaction: 10 },
    { os: 'iOS', share: 22.5, satisfaction: 12 },
    { os: 'BlackBerry', share: 6.8, satisfaction: 9 },
    { os: 'Symbian', share: 8.5, satisfaction: 8 },
    { os: 'Bada', share: 2.6, satisfaction: 7 },
    { os: 'Windows', share: 1.9, satisfaction: 6 },
];

export const DATA_MARKET_SHARE_WITH_NEGATIVE_VALUES = [
    { os: 'Android', share: 56.9, satisfaction: 10 },
    { os: 'iOS', share: 22.5, satisfaction: 12 },
    { os: 'BlackBerry', share: -6.8, satisfaction: 9 },
    { os: 'Symbian', share: 8.5, satisfaction: 8 },
    { os: 'Bada', share: 2.6, satisfaction: 7 },
    { os: 'Windows', share: 1.9, satisfaction: 6 },
];

export const DATA_VARIABLE_RADIUS_REVENUE = [
    { category: 'Smartphones', value: 4200000, profitMargin: 0.12 },
    { category: 'Laptops', value: 5800000, profitMargin: 0.08 },
    { category: "Women's Apparel", value: 5100000, profitMargin: 0.48 },
    { category: "Children's Apparel", value: 1900000, profitMargin: 0.35 },
    { category: 'Furniture', value: 8500000, profitMargin: 0.38 },
    { category: 'Appliances', value: 5500000, profitMargin: 0.22 },
    { category: 'Decor', value: 1100000, profitMargin: 0.55 },
];

const count = 50;
export const DATA_MANY_LONG_LABELS = Array.from({ length: count }).map((_, i) => {
    return {
        value: count - i,
        label: `Very very long label ${i + 1}`,
    };
});
