import { AgChartLegendPosition, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const legendPositions: Array<AgChartLegendPosition> = ['bottom', 'left', 'right', 'top'];

function toIntegratedData(key: string, d: any[]) {
    const result = [];
    let id = 0;
    for (const next of d) {
        result.push({
            ...next,
            [key]: {
                id: id++,
                value: next[key],
                toString() {
                    return next[key];
                },
            },
        });
    }
    return result;
}

let data = toIntegratedData('quarter', getData());

const series: NonNullable<AgChartOptions['series']> = [
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'quarter',
        yKey: 'iphone',
        yName: 'iPhone',
        stackGroup: 'Devices',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'quarter',
        yKey: 'mac',
        yName: 'Mac',
        stackGroup: 'Devices',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'quarter',
        yKey: 'ipad',
        yName: 'iPad',
        stackGroup: 'Devices',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'quarter',
        yKey: 'wearables',
        yName: 'Wearables',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'quarter',
        yKey: 'services',
        yName: 'Services',
        label: {
            color: 'white',
        },
    },
];

const options: AgChartOptions = {
    theme: 'ag-default',
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data,
    series,
    legend: {},
};

const chart = AgCharts.create(options);

function reset() {
    data = toIntegratedData('quarter', getData());
    options.data = data;
    AgCharts.update(chart, options as any);
}

function randomise() {
    options.data = [
        ...data.map((d: any) => ({
            ...d,
            iphone: d.iphone + Math.floor(Math.random() * 50 - 25),
        })),
    ];
    AgCharts.update(chart, options as any);
}

function removeData() {
    options.data = options.data?.slice(0, options.data.length - 1);
    AgCharts.update(chart, options as any);
}

function removeSeries() {
    options.series = series.slice(0, options.series!.length - 1);
    AgCharts.update(chart, options as any);
}

function addSeries() {
    options.series = series.slice(0, options.series!.length + 1);
    AgCharts.update(chart, options as any);
}

function switchDirection() {
    options.series?.forEach((s: any) => (s.direction = s.direction === 'horizontal' ? 'vertical' : 'horizontal'));
    AgCharts.update(chart, options as any);
}

function switchToGrouped() {
    options.series?.forEach((s: any) => delete s['stackGroup']);
    AgCharts.update(chart, options as any);
}

function switchToStacked() {
    options.series?.forEach((s: any, i) => {
        if (i < 3) {
            s.stackGroup = 'Devices';
        }
    });
    AgCharts.update(chart, options as any);
}

function moveLegend() {
    const currentPosition = legendPositions.indexOf(options.legend?.position ?? 'bottom');
    options.legend ??= {};
    options.legend.position = legendPositions[(currentPosition + 1) % 4];
    AgCharts.update(chart, options as any);
}

function changeTheme() {
    const themes = ['ag-default', 'ag-sheets', 'ag-polychroma'] as const;
    const idx = themes.indexOf(options.theme as any);

    options.theme = themes[(idx + 1) % themes.length];
    AgCharts.update(chart, options);
}
