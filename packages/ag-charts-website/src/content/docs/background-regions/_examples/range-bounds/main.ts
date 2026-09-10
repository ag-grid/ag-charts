import {
    AgCartesianChartOptions,
    AgCharts,
    AgSeriesAreaBackgroundRegion,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);

const bounds: Record<string, AgSeriesAreaBackgroundRegion> = {
    closed: {
        xRange: { start: new Date(2025, 5, 1), end: new Date(2025, 8, 1) },
        yRange: { start: 20, end: 50 },
    },
    open: {
        xRange: { start: new Date(2025, 5, 1) },
        yRange: { end: 50 },
    },
    full: {
        yRange: { start: 20, end: 50 },
    },
};

function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatBoundsSubtitle(mode: string) {
    const { xRange, yRange } = bounds[mode];

    const x = `${xRange?.start ? formatDate(xRange.start) : 'undefined'} – ${xRange?.end ? formatDate(xRange.end) : 'undefined'}`;
    const y = `${yRange?.start ?? 'undefined'} – ${yRange?.end ?? 'undefined'}`;

    return `X: ${x}   Y: ${y}`;
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Reservoir Capacity',
    },
    subtitle: {
        text: formatBoundsSubtitle('open'),
    },
    seriesArea: {
        backgroundRegions: [
            {
                ...bounds.open,
                label: {
                    text: 'Drought Risk',
                },
            },
        ],
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'capacity',
            yName: 'Capacity',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
            title: {
                text: 'Capacity (%)',
            },
            min: 0,
        },
    },
};

const chart = AgCharts.create(options);

function setBounds(event: Event) {
    const mode = (event.target as HTMLInputElement).value;
    const region = options.seriesArea!.backgroundRegions![0];

    region.xRange = bounds[mode].xRange;
    region.yRange = bounds[mode].yRange;

    options.subtitle!.text = formatBoundsSubtitle(mode);

    chart.update(options);
}
