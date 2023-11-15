import { AgChartOptions, AgCharts, AgTreemapSeriesOptions } from 'ag-charts-enterprise';

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
                interactive: false,
            },
            tile: {
                label: {
                    color: 'white',
                },
            },
            tileSpacing: 1,
            highlightStyle: {
                tile: {
                    label: {
                        color: 'white',
                    },
                    strokeWidth: 2,
                },
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

AgCharts.create(options);
