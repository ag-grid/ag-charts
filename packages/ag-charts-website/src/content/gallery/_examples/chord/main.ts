// Source: https://survey.stackoverflow.co
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const numberFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Technologies Developers Want to Learn',
    },
    subtitle: {
        text: 'StackOverflow Survey Results',
    },
    data: getData(),
    series: [
        {
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'frequency',
            tooltip: {
                renderer: ({ datum }) =>
                    datum != null
                        ? {
                              title: `${numberFormatter.format(datum.frequency)} ${datum.from} developers want to learn ${datum.to}`,
                              data: [],
                          }
                        : { data: [] },
            },
        },
    ],
};

AgCharts.create(options);
