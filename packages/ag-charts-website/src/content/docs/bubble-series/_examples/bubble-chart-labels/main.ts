import { AgBubbleSeriesOptions, AgChartOptions, AgCharts } from 'ag-charts-community';

import { femaleHeightWeight, maleHeightWeight } from './height-weight-data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Weight vs Height)',
    },
    subtitle: {
        text: 'With Name Labels',
    },
    series: [
        {
            type: 'bubble',
            title: 'Male',
            data: maleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            marker: {
                shape: 'square',
                fill: '#e36f6ab5',
                stroke: '#9f4e4a',
            },
            label: {
                enabled: true,
            },
        },
        {
            type: 'bubble',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            marker: {
                fill: '#7b91deb5',
                stroke: '#56659b',
            },
            label: {
                enabled: true,
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Height',
            },
            label: {
                formatter: (params) => {
                    return params.value + 'cm';
                },
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Weight',
            },
            label: {
                formatter: (params) => {
                    return params.value + 'kg';
                },
            },
        },
    ],
};

const chart = AgCharts.create(options);

function updateFontSize(event: any) {
    var value = +event.target.value;

    (options.series![0] as AgBubbleSeriesOptions).label!.fontSize = value;
    (options.series![1] as AgBubbleSeriesOptions).label!.fontSize = value;
    chart.update(options);

    document.getElementById('fontSizeSliderValue')!.innerHTML = String(value);
}
