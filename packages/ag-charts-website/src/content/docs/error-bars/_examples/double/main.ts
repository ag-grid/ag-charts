import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
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
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            errorBar:  {
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
        options.series[0].type = 'scatter';
    }
    AgEnterpriseCharts.update(chart, options);
}

function line() {
    if (options.series !== undefined) {
        options.series[0].type = 'line';
    }
    AgEnterpriseCharts.update(chart, options);
}
