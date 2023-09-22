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
            role: 'Laboratory Technician',
            min: 1102,
            q1: 2380,
            median: 2926,
            q3: 3907,
            max: 6074,
            outliers: [6323, 6472, 6674, 6782, 7403],
        },
        {
            role: 'Sales Representative',
            min: 1359,
            q1: 2269,
            median: 2610,
            q3: 2909,
            max: 3540,
            outliers: [1052, 1081, 1091, 1118, 1200, 3875, 3931, 4400, 4502, 5405, 6632],
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
