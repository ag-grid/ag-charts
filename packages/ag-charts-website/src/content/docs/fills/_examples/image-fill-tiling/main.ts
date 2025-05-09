import { AgCharts, AgDonutSeriesOptions, AgImageFill, AgPolarChartOptions } from 'ag-charts-community';

import { getData } from './data';

const data = getData();

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'donut',
            angleKey: 'percent',
            radiusKey: 'environmentalImpact',
            innerRadiusRatio: 0.2,
            fills: data.map(({ mode }) => {
                return {
                    type: 'image',
                    url: '${baseWWWUrl}/example-assets/docs-images/' + `${mode}.png`,
                    width: 20,
                    height: 20,
                    repeat: 'repeat',
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

function repeatX() {
    const series = options.series![0] as AgDonutSeriesOptions;
    series.fills = series.fills?.map((fill) => ({
        ...(fill as AgImageFill),
        repeat: 'repeat-x',
    }));
    chart.update(options);
}

function repeatY() {
    const series = options.series![0] as AgDonutSeriesOptions;
    series.fills = series.fills?.map((fill) => ({
        ...(fill as AgImageFill),
        repeat: 'repeat-y',
    }));
    chart.update(options);
}
