import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts, Marker } from 'ag-charts-enterprise';

import { getData } from './data';

class AGChartsLogo extends Marker {
    updatePath() {
        const { path } = this;
        const pathData = [
            'M58,10l-17,0l-8,8l25,0l0,-8Z',
            'M43,30l0,-7.995l-14,0l-8.008,7.995l22.008,0Z',
            'M13,38.01l4,-4.01l14,0l0,8l-18,0l0,-3.99Z',
            'M41,10l-4,4l-26,0l0,-8l30,0l0,4Z',
            'M16,26l9,0l8,-8l-17,0l0,8Z',
            'M6,37.988l7,0.012l7.992,-8l-14.992,-0.047l-0,8.035Z',
        ];
        updatePath(pathData, path, 0.4, 12, 10);
    }
}

class NpmLogo extends Marker {
    updatePath() {
        const { path } = this;
        const pathData = ['M5.8,21.75l7.86,0l0,-11.77l3.92,0l0,11.78l3.93,0l0,-15.7l-15.7,0l0,15.69'];
        updatePath(pathData, path, 0.75, 5, 11);
    }
}

const tooltip = {
    renderer: ({ datum, xName, yName, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
        return {
            content: `<b>${xName}:</b> ${datum[xKey].toLocaleString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })}<br/><b>${yName}: </b>${datum[yKey].toLocaleString('en-GB')}`,
        };
    },
};

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
            shape: AGChartsLogo,
            fillOpacity: 1,
            tooltip,
        },
        {
            type: 'scatter',
            xKey: 'date',
            xName: 'Date',
            yKey: 'npmDownloads',
            yName: 'NPM Downloads',
            shape: NpmLogo,
            fillOpacity: 1,
            tooltip,
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
                padding: 15,
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
                padding: 15,
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
                padding: 10,
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

function updatePath(pathData: string[], path: any, scale: number, xOffset: number, yOffset: number) {
    path.clear();
    pathData.forEach((pathDatum) => {
        const parts = pathDatum.split('l');
        let startX = parseFloat(parts[0].substring(1).split(',')[0]) * scale - xOffset;
        let startY = parseFloat(parts[0].substring(1).split(',')[1]) * scale - yOffset;
        path.moveTo(startX, startY);

        for (let i = 1; i < parts.length; i++) {
            const coords = parts[i].split(',');
            const x = parseFloat(coords[0]) * scale;
            const y = parseFloat(coords[1]) * scale;
            path.lineTo(startX + x, startY + y);
            startX += x;
            startY += y;
        }
    });
    path.closePath();
}
