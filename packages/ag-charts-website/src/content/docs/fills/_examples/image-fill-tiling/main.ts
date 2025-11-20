import { AgCharts, AgColorRepeat, AgDonutSeriesOptions, AgImageFill, AgPolarChartOptions } from 'ag-charts-community';
import { DonutSeriesModule, ModuleRegistry } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([DonutSeriesModule]);
const data = getData();

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'A City in Motion: How Londoners Commute',
    },
    series: [
        {
            type: 'donut',
            angleKey: 'percent',
            innerRadiusRatio: 0.2,
            legendItemKey: 'mode',
            fills: data.map(({ mode }) => {
                return {
                    type: 'image',
                    url: '${baseWWWUrl}/example-assets/docs-images/' + `${mode.toLowerCase()}.png`,
                    width: 20,
                    height: 20,
                    repeat: 'no-repeat', // Default
                };
            }),
        },
    ],
};

const chart = AgCharts.create(options);

function repeat(type: AgColorRepeat) {
    const series = options.series![0] as AgDonutSeriesOptions;
    series.fills = series.fills?.map((fill) => ({
        ...(fill as AgImageFill),
        repeat: type,
    }));
    chart.update(options);
}
