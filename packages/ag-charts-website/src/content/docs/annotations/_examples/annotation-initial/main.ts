import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { femaleHeightWeight, maleHeightWeight } from './data';

function lineOfBestFit(data: Array<{ height: number; weight: number }>) {
    const mean = data.reduce(
        (sum, { height, weight }) => ({
            height: sum.height + height / data.length,
            weight: sum.weight + weight / data.length,
        }),
        { height: 0, weight: 0 }
    );
    const gradient =
        data.reduce((sum, { height, weight }) => sum + (height - mean.height) * (weight - mean.weight), 0) /
        data.reduce((sum, { height }) => sum + Math.pow(height - mean.height, 2), 0);
    const intercept = mean.weight - gradient * mean.height;
    return { gradient, intercept };
}

const maleLine = lineOfBestFit(maleHeightWeight);
const femaleLine = lineOfBestFit(femaleHeightWeight);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Weight vs Height',
    },
    subtitle: {
        text: 'by gender',
    },
    annotations: {
        enabled: true,
    },
    initialState: {
        annotations: [
            {
                type: 'line',
                locked: true,
                start: { x: 157.2, y: maleLine.gradient * 157.2 + maleLine.intercept },
                end: { x: 198.1, y: maleLine.gradient * 198.1 + maleLine.intercept },
                stroke: '#5090dc',
            },
            {
                type: 'line',
                locked: true,
                start: { x: 147.2, y: femaleLine.gradient * 147.2 + femaleLine.intercept },
                end: { x: 182.9, y: femaleLine.gradient * 182.9 + femaleLine.intercept },
                stroke: '#ffa03a',
            },
        ],
    },
    legend: {
        enabled: false,
    },
    series: [
        {
            type: 'scatter',
            title: 'Male',
            data: maleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            fillOpacity: 0.2,
            strokeOpacity: 0.2,
        },
        {
            type: 'scatter',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            fillOpacity: 0.2,
            strokeOpacity: 0.2,
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

AgCharts.create(options);
