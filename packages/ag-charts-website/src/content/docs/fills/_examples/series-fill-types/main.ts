import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
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

function defaultFill() {
    (options.series as AgBarSeriesOptions[])?.forEach((series) => {
        series.fill = undefined;
    });

    chart.update(options);
}

function gradientFill() {
    (options.series as AgBarSeriesOptions[])?.forEach((series) => {
        series.fill = {
            type: 'gradient',
        };
    });

    chart.update(options);
}

function patternFill() {
    (options.series as AgBarSeriesOptions[])?.forEach((series) => {
        series.fill = {
            type: 'pattern',
        };
    });

    chart.update(options);
}

function imageFill() {
    (options.series as AgBarSeriesOptions[])?.forEach((series) => {
        series.fill = {
            type: 'image',
            url: '${baseWWWUrl}/example-assets/docs-images/' + `${series.yKey}.png`,
            backgroundFillOpacity: 0.4,
            width: 30,
            height: 30,
        };
    });

    chart.update(options);
}
