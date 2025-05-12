import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'The Musical Spectrum',
    },
    subtitle: {
        text: 'Musical instruments by popularity, invention era, and learning curve',
    },
    seriesArea: {
        padding: {
            right: 30,
            left: 30,
            top: 30,
            bottom: 30,
        },
    },
    series: [
        {
            type: 'bubble',
            xKey: 'year_of_invention',
            xName: 'Year of Invention',
            yKey: 'difficulty',
            yName: 'Difficulty',
            sizeKey: 'popularity',
            sizeName: 'Popularity',
            labelKey: 'instrument',
            labelName: 'Instrument',
            label: { enabled: true },
            maxSize: 50,
            size: 15,
            strokeWidth: 2,
            itemStyler: ({ datum }) => {
                return {
                    fill: {
                        type: 'image',
                        url: '${baseWWWUrl}/example-assets/docs-images/' + `${datum.instrument}.png`,
                    },
                };
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Year Of Invention',
            },
            gridLine: {
                enabled: false,
            },
            crosshair: {
                label: {
                    format: `#{d} CE`,
                },
            },
            label: {
                formatter: ({ value }) => (value === -250 ? `BCE` : value === 250 ? `CE` : `${value} CE`),
            },
            interval: {
                values: [-250, 250],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    lineDash: [1, 2],
                },
            ],
        },
        {
            position: 'right',
            type: 'number',
            gridLine: {
                enabled: true,
            },
            min: 0,
            max: 10,
            label: {
                formatter: ({ value }) => (value === 0 ? `Easy` : value === 10 ? `Difficult` : value),
            },
            interval: {
                values: [0, 10],
            },
        },
    ],
};

AgCharts.create(options);
