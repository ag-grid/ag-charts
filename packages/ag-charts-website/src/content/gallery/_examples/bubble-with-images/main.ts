import { BubbleSeriesModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule]);
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
            itemStyler: ({ datum, highlightState }) => {
                if (highlightState === 'highlighted-item') return;
                return {
                    fill: {
                        type: 'image',
                        url: '${baseWWWUrl}/example-assets/docs-images/' + `${datum.instrument}.png`,
                    },
                };
            },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Year Of Invention',
            },
            gridLine: {
                enabled: false,
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
        y: {
            position: 'right',
            type: 'number',
            gridLine: {
                enabled: true,
            },
            min: 0,
            max: 10,
            interval: {
                values: [0, 10],
            },
        },
    },
    formatter: {
        x: (params) => {
            const value = params.value as number;
            const era = value < 0 ? 'BCE' : 'CE';
            if (params.source === 'axis-label') return era;
            return `${Math.abs(value)} ${era}`;
        },
        y: (params) => {
            const value = params.value as number;
            if (params.source === 'axis-label') return value > 5 ? 'Difficult' : 'Easy';
            return value.toFixed(0);
        },
    },
};

AgCharts.create(options);
