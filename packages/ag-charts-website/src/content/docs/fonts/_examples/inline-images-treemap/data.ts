export interface TData {
    name: string;
    slug: string;
    value: number;
}

export interface TGroup {
    name: string;
    children: TData[];
}

export function getData(): TGroup[] {
    return [
        {
            name: 'Hardware',
            children: [
                { name: 'Apple', slug: 'apple', value: 383 },
                { name: 'NVIDIA', slug: 'nvidia', value: 244 },
                { name: 'Intel', slug: 'intel', value: 87 },
                { name: 'Tesla', slug: 'tesla', value: 67 },
            ],
        },
        {
            name: 'Software',
            children: [
                { name: 'Google', slug: 'google', value: 333 },
                { name: 'Meta', slug: 'meta', value: 196 },
                { name: 'SAP', slug: 'sap', value: 58 },
                { name: 'Shopify', slug: 'shopify', value: 36 },
            ],
        },
        {
            name: 'Services',
            children: [
                { name: 'Netflix', slug: 'netflix', value: 38 },
                { name: 'Spotify', slug: 'spotify', value: 21 },
                { name: 'Airbnb', slug: 'airbnb', value: 24 },
                { name: 'Uber', slug: 'uber', value: 32 },
                { name: 'PayPal', slug: 'paypal', value: 27 },
                { name: 'Stripe', slug: 'stripe', value: 14 },
            ],
        },
    ];
}
