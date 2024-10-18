import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pyramid',
            stageKey: 'incomeBracket',
            valueKey: 'adults',
            spacing: 10,
            fillOpacity: 1,
            aspectRatio: 1.2,
            label: {
                formatter: ({ value, datum }) =>
                    datum.group === 'Lower Middle Class' || datum.group === 'Bottom 50%'
                        ? `${datum.percentage}\n${value.toLocaleString()}`
                        : datum.group === 'Upper Middle Class'
                          ? `${datum.percentage}`
                          : ``,
            },
        },
    ],
};

AgCharts.create(options);
