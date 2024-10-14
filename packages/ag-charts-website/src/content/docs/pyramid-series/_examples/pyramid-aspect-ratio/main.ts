import { AgChartOptions, AgCharts, AgPyramidSeriesOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    seriesArea: {
        padding: {
            left: 20,
            right: 20,
        },
    },
    series: [
        {
            type: 'pyramid',
            stageKey: 'group',
            valueKey: 'value',
            aspectRatio: 3 / 2,
            label: {
                enabled: false,
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setDirection(direction: 'horizontal' | 'vertical') {
    (options.series![0] as AgPyramidSeriesOptions).direction = direction;
    chart.update(options);
}

function setAspectRatio(aspectRatio: number) {
    (options.series![0] as AgPyramidSeriesOptions).aspectRatio = aspectRatio;
    chart.update(options);
}
