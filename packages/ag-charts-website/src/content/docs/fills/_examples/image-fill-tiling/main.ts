import { AgCharts, AgDonutSeriesOptions, AgImageFill, AgPolarChartOptions } from 'ag-charts-community';

import { getData } from './data';

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
                    repeat: 'no-repeat',
                };
            }),
        },
    ],
};

const chart = AgCharts.create(options);

function noRepeat() {
    const series = options.series![0] as AgDonutSeriesOptions;
    series.fills = series.fills?.map((fill) => ({
        ...(fill as AgImageFill),
        repeat: 'no-repeat',
    }));
    chart.update(options);
}

function repeat() {
    const series = options.series![0] as AgDonutSeriesOptions;
    series.fills = series.fills?.map((fill) => ({
        ...(fill as AgImageFill),
        repeat: 'repeat',
    }));
    chart.update(options);
}
