// @ag-skip-fws
import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { DonutSeriesModule, ModuleRegistry } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([DonutSeriesModule, LegendModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Portfolio Composition',
    },
    subtitle: {
        text: 'Versus Previous Year',
    },
    series: [
        {
            type: 'donut',
            title: {
                text: 'Previous Year',
            },
            calloutLabelKey: 'asset',
            legendItemKey: 'asset',
            angleKey: 'previousYear',
            outerRadiusRatio: 1,
            innerRadiusRatio: 0.9,
        },
        {
            type: 'donut',
            title: {
                text: 'Current Year',
            },
            legendItemKey: 'asset',
            showInLegend: false,
            angleKey: 'currentYear',
            outerRadiusRatio: 0.6,
            innerRadiusRatio: 0.2,
        },
    ],
};

const chart = AgCharts.create(options);

function onGetState(): void {
    setTimeout(() => console.log(chart.getState()), 1000);
}
