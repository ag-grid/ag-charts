import { AgCartesianChartOptions, AgChartLegendPosition, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const legendPositions: Array<AgChartLegendPosition> = ['bottom', 'left', 'right', 'top'];
const stackGroups = ['Devices', 'Devices', 'Devices', 'Wearables', 'Series'];
const modes = ['standalone', 'integrated'] as const;
let mode = modes[0];
const modeButton = document.getElementById('modeButton')!;

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

const series: NonNullable<AgCartesianChartOptions['series']> = [
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

const options: AgCartesianChartOptions & { mode: (typeof modes)[number] } = {
    theme: 'ag-default',
    mode,
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
    options.series = [...series];
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

    if (options.mode === 'integrated') {
        chart.resetAnimations();
    }
    AgCharts.update(chart, options as any);
}

function switchToGrouped() {
    options.series?.forEach((s: any) => delete s['stackGroup']);

    if (options.mode === 'integrated') {
        chart.resetAnimations();
    }
    AgCharts.update(chart, options as any);
}

function switchToStacked() {
    options.series?.forEach((s: any, i) => {
        s.stackGroup = stackGroups[i];
    });

    if (options.mode === 'integrated') {
        chart.resetAnimations();
    }
    AgCharts.update(chart, options as any);
}

function moveLegend() {
    const currentPosition = legendPositions.indexOf(options.legend?.position ?? 'bottom');
    options.legend ??= {};
    options.legend.position = legendPositions[(currentPosition + 1) % 4];

    if (options.mode === 'integrated') {
        chart.skipAnimations();
    }
    AgCharts.update(chart, options as any);
}

function changeTheme() {
    const themes = ['ag-default', 'ag-sheets', 'ag-polychroma'] as const;
    const idx = themes.indexOf(options.theme as any);

    options.theme = themes[(idx + 1) % themes.length];

    if (options.mode === 'integrated') {
        chart.skipAnimations();
    }
    AgCharts.update(chart, options);
}

function toggleMode() {
    const nextMode = modes[(modes.indexOf(options.mode) + 1) % modes.length];
    options.mode = nextMode;
    modeButton.textContent = `Mode: ${nextMode}`;

    AgCharts.update(chart, options);
}
