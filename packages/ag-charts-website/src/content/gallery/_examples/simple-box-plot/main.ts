import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { BandHighlightModule, BoxPlotSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BandHighlightModule,
    BoxPlotSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'European Migration Patterns',
    },
    subtitle: {
        text: 'Q2 2023 Monthly Arrival Distribution',
    },
    footnote: {
        text: 'Source: UN International Organization for Migration',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            xKey: 'countryOfArrival',
            xName: 'Country',
            yName: 'Monthly Arrivals',
            minKey: 'min',
            minName: 'Minimum',
            q1Key: 'q1',
            q1Name: 'First Quartile',
            medianKey: 'median',
            medianName: 'Median',
            q3Key: 'q3',
            q3Name: 'Third Quartile',
            maxKey: 'max',
            maxName: 'Maximum',
            cornerRadius: 4,
            fillOpacity: 0.7,
            whisker: {
                strokeWidth: 1,
            },
            cap: {
                lengthRatio: 0.4,
            },
            tooltip: {
                renderer: ({ datum, xKey, minKey, q1Key, medianKey, q3Key, maxKey }) => {
                    const country = datum[xKey];
                    const min = datum[minKey];
                    const q1 = datum[q1Key];
                    const median = datum[medianKey];
                    const q3 = datum[q3Key];
                    const max = datum[maxKey];
                    const iqr = q3 - q1;

                    return {
                        title: country,
                        data: [
                            { label: 'Minimum', value: min.toLocaleString() },
                            { label: 'Q1', value: q1.toLocaleString() },
                            { label: 'Median', value: median.toLocaleString() },
                            { label: 'Q3', value: q3.toLocaleString() },
                            { label: 'Maximum', value: max.toLocaleString() },
                            { label: 'IQR', value: iqr.toLocaleString() },
                        ],
                    };
                },
            },
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            paddingInner: 0.7,
            bandHighlight: {
                enabled: true,
            },
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
            label: {
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Number of Arrivals',
            },
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [3, 3] }, { strokeWidth: 0 }],
            },
            label: {
                formatter: ({ value }) => {
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(0)}k`;
                    }
                    return value.toLocaleString();
                },
            },
            crossLines: [
                {
                    type: 'line',
                    value: 5000,
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        position: 'top-right',
                        text: 'Target: 5,000',
                    },
                },
            ],
        },
    },
};

AgCharts.create(options);
