import {
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    AgMarkerShapeFnParams,
    AgPath,
    BandHighlightModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BandHighlightModule,
    LegendModule,
    NumberAxisModule,
    ScatterSeriesModule,
    UnitTimeAxisModule,
]);
function agChartsLogo({ path, size, x, y }: AgMarkerShapeFnParams) {
    const pathData = [
        'M0.480769 0.846154V0.692308H0.211538L0.134615 0.769423V0.846154H0.480769Z',
        'M0 0.615385V0.769L0.134615 0.769231L0.288308 0.615385L0 0.614481V0.615385Z',
        'M1 0.384615V0.230769H0.673077L0.596154 0.307692L0.519231 0.384615H1Z',
        'M0.596154 0.307692L0.673077 0.230769V0.153846H0.0961538V0.307692H0.596154Z',
        'M0.711538 0.615385V0.461635H0.442308L0.383074 0.520772L0.365385 0.538462H0.365356L0.288308 0.615385H0.711538Z',
        'M0.192308 0.384615V0.538462H0.365356L0.383074 0.520772L0.519231 0.384615H0.192308Z',
    ].join('');
    updatePath(pathData, path, size, x, y);
}

function npmLogo({ path, size, x, y }: AgMarkerShapeFnParams) {
    const pathData = 'M0.8325 0.8325H0.6993V0.2997H0.4995V0.8325H0.1665V0.1665H0.8325V0.8325Z';
    updatePath(pathData, path, size, x, y);
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'AG Charts Growth: Accelerating Adoption Through 2022',
    },
    subtitle: {
        text: 'Monthly NPM downloads and daily website visits show strong correlation',
    },
    footnote: {
        text: 'Data: NPM Registry & AG Charts Analytics | Jan 2020 - Oct 2022',
    },
    data: getData(),
    series: [
        {
            type: 'scatter',
            xKey: 'date',
            xName: 'Date',
            yKey: 'numberOfVisits',
            yName: 'Daily Website Visits',
            title: 'Website Visits',
            shape: agChartsLogo,
            size: 20,
            fillOpacity: 1,
        },
        {
            type: 'scatter',
            xKey: 'date',
            xName: 'Date',
            yKey: 'npmDownloads',
            yName: 'NPM Downloads',
            yKeyAxis: 'ySecondary',
            title: 'NPM Downloads',
            shape: npmLogo,
            size: 20,
            fillOpacity: 1,
        },
    ],
    axes: {
        y: {
            position: 'right',
            type: 'number',
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            label: {
                spacing: 15,
            },
            title: {
                text: 'Website Visits',
            },
        },
        ySecondary: {
            position: 'left',
            type: 'number',
            title: {
                text: 'NPM Downloads',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            label: {
                spacing: 15,
            },
        },
        x: {
            position: 'bottom',
            type: 'unit-time',
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                ],
            },
            bandHighlight: {
                enabled: true,
            },
            label: {
                spacing: 10,
            },
            tick: {
                size: 30,
            },
        },
    },
    legend: {
        position: 'bottom',
        spacing: 20,
    },
    tooltip: {
        enabled: true,
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    formatter: {
        x: (params) => {
            if (!(params.value instanceof Date)) return String(params.value);
            return params.value.toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
            });
        },
        y: (params) => {
            if (params.type !== 'number') return;
            const value = params.value / 1000;
            const fractionDigits = params.source === 'tooltip' ? 1 : 0;

            if (value >= 100) {
                return `${value.toFixed(fractionDigits)}K`;
            }
            return `${value.toFixed(fractionDigits)}K`;
        },
    },
};

AgCharts.create(options);

function updatePath(pathData: string, path: AgPath, scale: number, x: number, y: number) {
    path.clear();

    let x0 = 0;
    let y0 = 0;
    for (const { 1: command, 2: coordinateString } of pathData.matchAll(/([a-z])([^a-z]*)/gi)) {
        const coordinates = Array.from(coordinateString.matchAll(/([\d.]+)/g), (m) => (parseFloat(m[0]) - 0.5) * scale);

        const relative = command === command.toLowerCase();
        const dx = relative ? x0 : 0;
        const dy = relative ? y0 : 0;

        switch (command.toLowerCase()) {
            case 'm':
                x0 = x + coordinates[0] + dx;
                y0 = y + coordinates[1] + dy;
                path.moveTo(x0, y0);
                break;
            case 'l':
                x0 = x + coordinates[0] + dx;
                y0 = y + coordinates[1] + dy;
                path.lineTo(x0, y0);
                break;
            case 'v':
                y0 = y + coordinates[0] + dy;
                path.lineTo(x0, y0);
                break;
            case 'h':
                x0 = x + coordinates[0] + dx;
                path.lineTo(x0, y0);
                break;
            case 'z':
                path.closePath();
                break;
        }
    }
}
