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
            },
            errorBar: {
                yLowerKey: 'lowerCI',
                yUpperKey: 'upperCI',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setOffsetLabels(offsetLabels: boolean) {
    const series = options.series![0] as AgBarSeriesOptions;
    series.errorBar!.offsetLabels = offsetLabels;
    chart.update(options);
}
