import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'early',
            yName: 'Early',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
        },
    ],
};

const chart = AgCharts.create(options);

function fillChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    (options.series as AgBarSeriesOptions[])?.forEach((series) => {
        switch (value) {
            case 'gradient':
                series.fill = { type: 'gradient' };
                break;
            case 'pattern':
                series.fill = { type: 'pattern' };
                break;
            case 'image':
                series.fill = {
                    type: 'image',
                    url: '${baseWWWUrl}/example-assets/docs-images/' + `${series.yKey}.png`,
                    backgroundFillOpacity: 0.4,
                    width: 30,
                    height: 30,
                };
                break;
            default:
                series.fill = undefined;
        }
    });

    chart.update(options);
}
