// Source: https://survey.stackoverflow.co
import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ChordSeriesModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, ChordSeriesModule, NumberAxisModule]);
const numberFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Developer Technology Learning Patterns',
    },
    subtitle: {
        text: 'Cross-Technology Interest from StackOverflow Developer Survey 2024',
    },
    data: getData(),
    series: [
        {
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'frequency',
            link: {
                fillOpacity: 0.6,
            },
            node: {
                spacing: 3,
                width: 15,
            },
            label: {
                spacing: 8,
            },
            tooltip: {
                renderer: ({ datum }) => {
                    if (datum == null) return { data: [] };

                    const percentage = ((datum.frequency / 19793) * 100).toFixed(1); // 19793 is max frequency in data

                    return {
                        data: [
                            { label: 'Developers', value: numberFormatter.format(datum.frequency) },
                            { label: 'Relative interest', value: `${percentage}%` },
                        ],
                    };
                },
            },
        },
    ],
    formatter: (params) => {
        const { value, type } = params;

        if (type === 'number') {
            if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
            return value.toLocaleString();
        }
    },
};

AgCharts.create(options);
