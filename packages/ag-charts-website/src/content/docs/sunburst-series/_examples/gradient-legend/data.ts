export const data = [
    {
        name: 'Americas',
        children: [
            { name: 'United States', gdp: 26.949, gdpChange: 0.06 },
            { name: 'Canada', gdp: 2.117, gdpChange: -0.02 },
            { name: 'Brazil', gdp: 2.126, gdpChange: 0.11 },
            { name: 'Mexico', gdp: 1.322, gdpChange: -0.04 },
        ],
        gdpChange: 0.03,
    },
    {
        name: 'Asia',
        children: [
            { name: 'China', gdp: 17.7, gdpChange: -0.01 },
            { name: 'Japan', gdp: 4.23, gdpChange: 0 },
            { name: 'India', gdp: 4.0, gdpChange: 0.2 },
            { name: 'South Korea', gdp: 1.721, gdpChange: -0.03 },
        ],
        gdpChange: 0.04,
    },
    {
        name: 'Europe',
        children: [
            {
                name: 'EU',
                children: [
                    { name: 'Germany', gdp: 4.429, gdpChange: -0.05 },
                    { name: 'France', gdp: 3.049, gdpChange: 0.1 },
                    { name: 'Italy', gdp: 2.186, gdpChange: 0.09 },
                ],
                gdpChange: 0.03,
            },
            { name: 'United Kingdom', gdp: 3.332, gdpChange: -0.02 },
        ],
        gdpChange: 0.01,
    },
];
