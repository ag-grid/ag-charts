import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, AgImageFill } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
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
            },
        },
    ],
};

const chart = AgCharts.create(options);

function contain() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'contain',
    };
    chart.update(options);
}

function cover() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'cover',
    };
    chart.update(options);
}

function stretch() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'stretch',
    };
    chart.update(options);
}

function none() {
    const series = options.series![0] as AgBarSeriesOptions;
    series.fill = {
        ...(series.fill as AgImageFill),
        fit: 'none',
    };
    chart.update(options);
}
