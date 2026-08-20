import { AgCharts, AgPolarChartOptions, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-default',
    title: {
        text: 'Chart Theme Example',
    },
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
        },
    ],
};

const chart = AgCharts.create(options);

function themeChange(event: Event) {
    options.theme = (event.target as HTMLInputElement).value as AgPolarChartOptions['theme'];

    chart.update(options);
}
