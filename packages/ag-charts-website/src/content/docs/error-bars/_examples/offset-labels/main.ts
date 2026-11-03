import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ErrorBarsModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, ErrorBarsModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    seriesArea: { padding: { top: 10 } },
    title: {
        text: 'Monthly Dividends with 95% Confidence Intervals (%)',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'dividends',
            yName: 'Monthly Dividends (%)',
            label: {
                placement: 'outside-end',
                border: {},
                fill: { ref: 'backgroundColor' },
                collision: { alwaysShow: true },
            },
            errorBar: {
                yLowerKey: 'lowerCI',
                yUpperKey: 'upperCI',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function offsetLabelsChange(event: Event) {
    const series = options.series![0] as AgBarSeriesOptions;
    series.errorBar!.offsetLabels = (event.target as HTMLInputElement).value === 'true';
    chart.update(options);
}
