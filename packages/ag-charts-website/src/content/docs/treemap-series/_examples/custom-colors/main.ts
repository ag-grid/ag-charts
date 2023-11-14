import { AgChart, AgChartOptions, AgTreemapSeriesOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'exports',
            group: {
                label: {
                    fontSize: 18,
                    color: 'black',
                },
                fill: 'transparent',
                strokeWidth: 0,
                padding: 5,
                tileSpacing: 1,
                interactive: false,
            },
            tile: {
                label: {
                    color: 'white',
                },
                strokeWidth: 2,
                spacing: 2,
            },
            highlightStyle: {
                tile: {
                    label: {
                        color: 'white',
                    },
                },
            },
            formatter: ({ datum, highlighted }) => {
                if (datum.children) {
                    return { fill: 'white' };
                } else {
                    // const fill = parent.name === 'Foodstuffs' ? 'rgb(64, 172, 64)' : 'rgb(32, 96, 224)';
                    const fill = 'rgb(32, 96, 224)';
                    const stroke = highlighted ? 'black' : fill;
                    return { fill, stroke };
                }
            },
        } as AgTreemapSeriesOptions,
    ],
    title: {
        text: 'Exports of Krakozhia in 2022',
    },
    subtitle: {
        text: 'in millions US dollars',
    },
};

AgChart.create(options);
