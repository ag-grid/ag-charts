import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getArgon, getHelium, getOxygen } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Volume-Pressure Relationship with Confidence Intervals',
    },
    axes: [
        // Note: axis configuration is required only for line series.
        // The bottom axis defaults to 'number' for scatter series.
        { type: 'number', position: 'left' },
        { type: 'number', position: 'bottom' },
    ],
    series: [
        {
            data: getOxygen(),
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            title: 'Oxygen',
            errorBar: {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
            },
        },
        {
            data: getHelium(),
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            title: 'Helium',
            errorBar: {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
            },
        },
        {
            data: getArgon(),
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            title: 'Argon',
            errorBar: {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
            },
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);

function scatter() {
    if (options.series !== undefined) {
        for (const series of options.series) {
            series.type = 'scatter';
        }
    }
    AgEnterpriseCharts.update(chart, options);
}

function line() {
    if (options.series !== undefined) {
        for (const series of options.series) {
            series.type = 'line';
        }
    }
    AgEnterpriseCharts.update(chart, options);
}
