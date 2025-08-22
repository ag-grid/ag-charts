export function getData() {
    return {
        stores: [
            {
                store: 'Department Store',
                total: 4000000000,
            },
        ],
        departments: [
            { department: 'Electronics', value: 15000000 },
            { department: 'Clothing', value: 10000000 },
            { department: 'Home', value: 15000000 },
        ],
        categories: [
            // Electronics: Lower margins due to competitive market
            { category: 'Smartphones', value: 4200000, profitMargin: 0.12 },
            { category: 'Laptops', value: 5800000, profitMargin: 0.08 },
            { category: 'Cameras', value: 4700000, profitMargin: 0.18 },
            // Clothing: Medium to high margins for fashion items
            { category: "Men's", value: 3300000, profitMargin: 0.42 },
            { category: "Women's", value: 5100000, profitMargin: 0.48 },
            { category: "Children's", value: 1900000, profitMargin: 0.35 },
            // Home: Variable margins based on product type
            { category: 'Furniture', value: 8500000, profitMargin: 0.38 },
            { category: 'Appliances', value: 5500000, profitMargin: 0.22 },
            { category: 'Decor', value: 1100000, profitMargin: 0.55 },
        ],
    };
}
