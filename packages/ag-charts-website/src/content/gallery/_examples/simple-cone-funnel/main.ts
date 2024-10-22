import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'cone-funnel',
            stageKey: 'group',
            valueKey: 'value',
            stageLabel: {
                placement: 'after',
            },
            fillOpacity: 0.2,
            strokeWidth: 1,
            lineDash: [5],
            label: {
                formatter: ({ value, datum }) => (datum.group === 'INITIAL CONTACT' ? '' : value.toLocaleString()),
                spacing: 20,
            },
        },
    ],
};

AgCharts.create(options);
