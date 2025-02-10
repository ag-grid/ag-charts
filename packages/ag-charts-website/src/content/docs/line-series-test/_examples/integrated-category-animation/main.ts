import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const quarters = Array.from({ length: 14 }, (_, id) => ({
    id,
    label: `week ${id}`,
    toString: () => `week ${id}`,
}));

const data = [
    { quarter: quarters[3], week: 3, iphone: 60, android: 50 },
    { quarter: quarters[4], week: 4, iphone: 185, android: 90 },
    { quarter: quarters[5], week: 5, iphone: 148, android: 70 },
    { quarter: quarters[6], week: 6, iphone: 130, android: 130 },
    { quarter: quarters[9], week: 9, iphone: 62, android: 120 },
    { quarter: quarters[10], week: 10, iphone: 137, android: 105 },
    { quarter: quarters[11], week: 11, iphone: 121, android: 100 },
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data: data,
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'iphone',
            label: {
                formatter: ({ value }) => String(value),
            },
            // visible: false
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'android',
            label: {
                formatter: ({ value }) => String(value),
            },
            // visible: false
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'number',
        },
        {
            position: 'bottom',
            type: 'category',
        },
    ],
};
(options as any).mode = 'integrated';

const chart = AgCharts.create(options);

function actionReset() {
    options.data = data;
    chart.update(options);
}

function insertAfter(data: { week: number }[], afterWeek: number, toInsert: any) {
    const insertIndex = data.findIndex(({ week }) => week > afterWeek);
    if (insertIndex === -1) {
        return data.concat([toInsert]);
    }
    const newData = data.slice();
    newData.splice(insertIndex, 0, toInsert);
    return newData;
}

function actionAddEndWeek() {
    const data = options.data ?? [];
    const nextWeek = data.slice(-1)[0].week + 1;
    options.data = [
        ...data,
        {
            quarter: quarters[nextWeek],
            week: nextWeek,
            iphone: 78 * (Math.random() - 0.5),
            android: 65 * (Math.random() - 0.5),
        },
    ];
    chart.update(options);
}

function actionAddStartWeek() {
    const data = options.data ?? [];
    const prevWeek = data[0].week - 1;
    options.data = [
        {
            quarter: quarters[prevWeek],
            week: prevWeek,
            iphone: 78 * (Math.random() - 0.5),
            android: 65 * (Math.random() - 0.5),
        },
        ...data,
    ];
    chart.update(options);
}

function actionAddWeek12and13() {
    options.data = insertAfter(options.data!, 11, { quarter: quarters[12], week: 12, iphone: 78, android: 67 });
    options.data = insertAfter(options.data, 12, { quarter: quarters[13], week: 13, iphone: 138, android: 120 });
    options.data = options.data;
    chart.update(options);
}

function actionAddWeek7and8() {
    options.data = insertAfter(options.data!, 6, { quarter: quarters[7], week: 7, iphone: 142, android: 67 });
    options.data = insertAfter(options.data, 7, { quarter: quarters[8], week: 8, iphone: 87, android: 120 });
    options.data = options.data;
    chart.update(options);
}

function reverse() {
    options.data = options.data!.slice().reverse();
    chart.update(options);
}

function reorder() {
    options.data = [...(options.data ?? [])];
    options.data?.forEach((d) => (d.random = Math.random()));
    options.data?.sort((a, b) => a.random - b.random);

    chart.update(options);
}

function rapidUpdate() {
    chart.updateDelta({
        data: [...data, { quarter: quarters[12], iphone: 78, android: 67 }],
    });

    chart.waitForUpdate().then(() => {
        chart.updateDelta({
            data: [
                ...data,
                { quarter: quarters[12], week: 12, iphone: 78, android: 67 },
                { quarter: quarters[13], week: 13, iphone: 138, android: 120 },
            ],
        });
    });
}
