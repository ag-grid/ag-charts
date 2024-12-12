import { AgChartOptions, AgCharts, AgMarkerShapeFnParams } from 'ag-charts-enterprise';

import { getData } from './data';

function agChartsLogo({ path, size }: AgMarkerShapeFnParams) {
    const pathData = [
        'M0.480769 0.846154V0.692308H0.211538L0.134615 0.769423V0.846154H0.480769Z',
        'M0 0.615385V0.769L0.134615 0.769231L0.288308 0.615385L0 0.614481V0.615385Z',
        'M1 0.384615V0.230769H0.673077L0.596154 0.307692L0.519231 0.384615H1Z',
        'M0.596154 0.307692L0.673077 0.230769V0.153846H0.0961538V0.307692H0.596154Z',
        'M0.711538 0.615385V0.461635H0.442308L0.383074 0.520772L0.365385 0.538462H0.365356L0.288308 0.615385H0.711538Z',
        'M0.192308 0.384615V0.538462H0.365356L0.383074 0.520772L0.519231 0.384615H0.192308Z',
    ].join('');
    updatePath(pathData, path, size);
}

function npmLogo({ path, size }: AgMarkerShapeFnParams) {
    const pathData = 'M0 0H1V1H0H0ZM0.6875 0.8125H0.8125V0.1875H0.1875V0.8125H0.5V0.3125H0.6875V0.8125Z';
    updatePath(pathData, path, size);
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'AG Charts Popularity',
    },
    data: getData(),
    series: [
        {
            type: 'scatter',
            xKey: 'date',
            xName: 'Date',
            yKey: 'numberOfVisits',
            yName: 'Daily Website Visits',
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
            shape: npmLogo,
            size: 12,
            fillOpacity: 1,
        },
    ],
    axes: [
        {
            position: 'right',
            type: 'number',
            keys: ['numberOfVisits'],
            gridLine: {
                enabled: false,
            },
            label: {
                formatter: ({ value }) => `${value / 1000}K`,
                spacing: 15,
            },
            title: {
                text: 'Website Visits',
            },
            crosshair: {
                label: {
                    format: `s`,
                },
            },
        },
        {
            position: 'left',
            type: 'number',
            keys: ['npmDownloads'],
            title: {
                text: 'NPM Downloads',
            },
            gridLine: {
                enabled: false,
            },
            label: {
                formatter: ({ value }) => `${value / 1000}K`,
                spacing: 15,
            },
            crosshair: {
                label: {
                    format: `s`,
                },
            },
        },
        {
            position: 'bottom',
            type: 'time',
            gridLine: {
                enabled: true,
            },
            label: {
                format: '%b %y',
                spacing: 10,
            },
            tick: {
                size: 30,
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);

function updatePath(pathData: string, path: any, scale: number) {
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
                x0 = coordinates[0] + dx;
                y0 = coordinates[1] + dy;
                path.moveTo(x0, y0);
                break;
            case 'l':
                x0 = coordinates[0] + dx;
                y0 = coordinates[1] + dy;
                path.lineTo(x0, y0);
                break;
            case 'v':
                y0 = coordinates[0] + dy;
                path.lineTo(x0, y0);
                break;
            case 'h':
                x0 = coordinates[0] + dx;
                path.lineTo(x0, y0);
                break;
            case 'z':
                path.closePath();
                break;
        }
    }
}
