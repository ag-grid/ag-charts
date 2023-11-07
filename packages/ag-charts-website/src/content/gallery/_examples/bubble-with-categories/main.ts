import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { days, getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Punch Card of Github',
    },
    subtitle: {
        text: 'Time Distribution of Commits',
    },
    series: days.map((day) => ({
        data: data.filter((d) => d.day === day),
        type: 'bubble',
        xKey: 'hour',
        xName: 'Time',
        yKey: 'day',
        yName: day,
        sizeKey: 'size',
        sizeName: 'Commits',
        marker: {
            strokeWidth: 0,
            size: 0,
            maxSize: 40,
        },
    })),
    axes: [
        {
            position: 'bottom',
            type: 'category',
            label: {
                autoRotate: false,
            },
            gridLine: {
                enabled: true,
            },
            line: {
                // enabled: false, // using this breaks layout calculations and incorrect padding
                width: 0, // TODO: FIX
            },
        },
        {
            position: 'left',
            type: 'category',
            line: {
                width: 0, // TODO: FIX
            },
        },
    ],
    seriesArea: {
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 30,
        },
    },
};

AgEnterpriseCharts.create(options);
