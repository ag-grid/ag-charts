export function getBoxPlotData() {
    return [
        {
            role: 'Sales Executive',
            min: 4001,
            q1: 5071,
            median: 6232,
            q3: 8620,
            max: 13872,
            outliers: [],
        },
        {
            role: 'Research Scientist',
            min: 1009,
            q1: 2389,
            median: 2889,
            q3: 3904,
            max: 5974,
            outliers: [6220, 6322, 6545, 6646, 6854, 6962, 9724],
        },
        {
            role: 'Manufacturing Director',
            min: 4011,
            q1: 5121,
            median: 6474,
            q3: 9547,
            max: 13973,
            outliers: [],
        },
        {
            role: 'Manager',
            min: 12504,
            q1: 16437,
            median: 17465,
            q3: 19187,
            max: 19999,
            outliers: [11244, 11557, 11631, 11849, 11878, 11904, 11916, 11996],
        },
        {
            role: 'Research Director',
            min: 11031,
            q1: 13499,
            median: 16598,
            q3: 19038,
            max: 19973,
            outliers: [],
        },
        {
            role: 'Human Resources',
            min: 1555,
            q1: 2342,
            median: 3195,
            q3: 5985,
            max: 10725,
            outliers: [],
        },
    ];
}

export function getOutliersData() {
    return getBoxPlotData().flatMap((item) =>
        item.outliers.map((outlier) => ({
            role: item.role,
            salary: outlier,
        }))
    );
}
