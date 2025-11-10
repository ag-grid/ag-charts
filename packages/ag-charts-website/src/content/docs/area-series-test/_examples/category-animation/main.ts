import { AgCharts } from 'ag-charts-enterprise';
import { AgChartOptions } from 'ag-charts-types';

const data = [
    { time: 'week 3', week: 3, iphone: 60 },
    { time: 'week 4', week: 4, iphone: 185 },
    { time: 'week 5', week: 5, iphone: 148 },
    { time: 'week 6', week: 6, iphone: 130 },
    { time: 'week 9', week: 9, iphone: 62 },
    { time: 'week 10', week: 10, iphone: 137 },
    { time: 'week 11', week: 11, iphone: 121 },
];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data: [...data],
    series: [
        {
            type: 'area',
            xKey: 'time',
            yKey: 'iphone',
            label: {
                formatter: ({ value }) => String(value),
            },
            // visible: false
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
        },
        x: {
            position: 'bottom',
            type: 'category',
        },
    },
};

const chart = AgCharts.create(options as AgChartOptions);

function actionReset() {
    options.data = [...data];
    chart.update(options);
}

function actionAddEndWeek() {
    const data = options.data ?? [];
    const nextWeek = data.slice(-1)[0].week + 1;
    options.data = [
        ...data,
        {
            time: `week ${nextWeek}`,
            week: nextWeek,
            iphone: 78 * (Math.random() - 0.5),
        },
    ];
    chart.update(options);
}

function actionAddStartWeek() {
    const data = options.data ?? [];
    const prevWeek = data[0].week - 1;
    options.data = [
        {
            time: `week ${prevWeek}`,
            week: prevWeek,
            iphone: 78 * (Math.random() - 0.5),
        },
        ...data,
    ];
    chart.update(options);
}

function actionAddWeek12and13() {
    const data = [
        ...(options.data ?? []).filter((d) => d.week !== 12 && d.week !== 13),
        { time: 'week 12', week: 12, iphone: 78 },
        { time: 'week 13', week: 13, iphone: 138 },
    ];
    data.sort((a: any, b: any) => a.week - b.week);
    options.data = data;

    chart.update(options);
}

function actionAddWeek7and8() {
    const data = [
        ...(options.data ?? []).filter((d) => d.week !== 7 && d.week !== 8),
        { time: 'week 7', week: 7, iphone: 142 },
        { time: 'week 8', week: 8, iphone: 87 },
    ];
    data.sort((a: any, b: any) => a.week - b.week);
    options.data = data;

    chart.update(options);
}

function reorder() {
    const data = (options.data ?? []).map((d) => ({ ...d, random: Math.random() }));
    data.sort((a, b) => a.random - b.random);
    options.data = data;

    chart.update(options);
}

function rapidUpdate() {
    options.data = [...data, { time: 'week 12', iphone: 78 }];
    chart.update(options);

    chart.waitForUpdate().then(() => {
        options.data = [...data, { time: 'week 12', iphone: 78 }, { time: 'week 13', iphone: 138 }];
        chart.update(options);
    });
}
