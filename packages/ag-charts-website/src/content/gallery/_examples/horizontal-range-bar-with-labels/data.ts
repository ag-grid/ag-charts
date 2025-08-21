export interface SalesData {
    category: string;
    sales2022: number;
    sales2023: number;
}

export function getData(): SalesData[] {
    return [
        { category: 'Fresh Produce', sales2022: 450, sales2023: 520 },
        { category: 'Dairy & Eggs', sales2022: 380, sales2023: 480 },
        { category: 'Bakery', sales2022: 500, sales2023: 360 },
        { category: 'Meat & Fish', sales2022: 680, sales2023: 850 },
        { category: 'Beverages', sales2022: 420, sales2023: 510 },
        { category: 'Household', sales2022: 560, sales2023: 690 },
        { category: 'Health & Beauty', sales2022: 290, sales2023: 150 },
    ];
}
