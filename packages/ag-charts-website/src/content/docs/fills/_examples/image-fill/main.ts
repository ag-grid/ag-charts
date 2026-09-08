import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, AgImageFill, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Journey Time by Transport Mode',
    },
    series: [
        {
            type: 'bar',
            xKey: 'mode',
            yKey: 'timeToDestination',
            fill: {
                type: 'image',
                url: '${baseWWWUrl}/example-assets/docs-images/map.png',
                fit: 'stretch',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function fitChange(event: Event) {
    const fit = (event.target as HTMLInputElement).value as AgImageFill['fit'];
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit,
    };
    chart.update(options);
}
