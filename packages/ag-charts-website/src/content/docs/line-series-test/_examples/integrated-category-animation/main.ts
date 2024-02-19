import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const data = [
    { quarter: 'week 3', week: 3, iphone: 60, android: 50 },
    { quarter: 'week 4', week: 4, iphone: 185, android: 90 },
    { quarter: 'week 5', week: 5, iphone: 148, android: 70 },
    { quarter: 'week 6', week: 6, iphone: 130, android: 130 },
    { quarter: 'week 9', week: 9, iphone: 62, android: 120 },
    { quarter: 'week 10', week: 10, iphone: 137, android: 105 },
    { quarter: 'week 11', week: 11, iphone: 121, android: 100 },
];

function toIntegratedKey({ quarter, week, ...datum }: any, idx: number) {
    let quarterResult = quarter;
    if (typeof quarter === 'string') {
        quarterResult = { id: `${idx}`, value: quarter, toString: () => `${quarter}` };
    } else {
        quarterResult.id = `${idx}`;
    }
    return {
        ...datum,
        week,
        quarter: quarterResult,
    };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    mode: 'integrated',
    data: [...data].map(toIntegratedKey),
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

const chart = AgCharts.create(options);

function actionReset() {
    options.data = [...data];
    AgCharts.update(chart, options);
}

function actionAddEndWeek() {
    const data = options.data ?? [];
    const nextWeek = data.slice(-1)[0].week + 1;
    options.data = [
        ...data,
        {
            quarter: `week ${nextWeek}`,
            week: nextWeek,
            iphone: 78 * (Math.random() - 0.5),
            android: 65 * (Math.random() - 0.5),
        },
    ].map(toIntegratedKey);
    AgCharts.update(chart, options);
}

function actionAddStartWeek() {
    const data = options.data ?? [];
    const prevWeek = data[0].week - 1;
    options.data = [
        {
            quarter: `week ${prevWeek}`,
            week: prevWeek,
            iphone: 78 * (Math.random() - 0.5),
            android: 65 * (Math.random() - 0.5),
        },
        ...data,
    ].map(toIntegratedKey);
    AgCharts.update(chart, options);
}

function actionAddWeek12and13() {
    options.data = [
        ...(options.data ?? []),
        { quarter: 'week 12', week: 12, iphone: 78, android: 67 },
        { quarter: 'week 13', week: 13, iphone: 138, android: 120 },
    ].map(toIntegratedKey);
    options.data.sort((a: any, b: any) => a.week - b.week);
    AgCharts.update(chart, options);
}

function actionAddWeek7and8() {
    options.data = [
        ...(options.data ?? []),
        { quarter: 'week 7', week: 7, iphone: 142, android: 67 },
        { quarter: 'week 8', week: 8, iphone: 87, android: 120 },
    ].map(toIntegratedKey);
    options.data.sort((a: any, b: any) => a.week - b.week);
    AgCharts.update(chart, options);
}

function reorder() {
    options.data = [...(options.data ?? [])];
    options.data?.forEach((d) => (d.random = Math.random()));
    options.data?.sort((a, b) => a.random - b.random);
    options.data = options.data?.map(toIntegratedKey);

    AgCharts.update(chart, options);
}

function rapidUpdate() {
    AgCharts.updateDelta(chart, {
        data: [...data, { quarter: 'week 12', iphone: 78, android: 67 }],
    });

    (chart as any).chart.waitForUpdate().then(() => {
        AgCharts.updateDelta(chart, {
            data: [
                ...data,
                { quarter: 'week 12', week: 12, iphone: 78, android: 67 },
                { quarter: 'week 13', week: 13, iphone: 138, android: 120 },
            ].map(toIntegratedKey),
        });
    });
}
