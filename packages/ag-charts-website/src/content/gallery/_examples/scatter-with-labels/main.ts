import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'British Names',
    },
    footnote: {
        text: 'Source: Completely made up and random',
    },
    series: [
        {
            data: data.filter((d) => d.gender === 'Girl'),
            type: 'scatter',
            xKey: 'popularity',
            xName: 'Popularity',
            yKey: 'trend',
            labelKey: 'name',
            labelName: 'Name',
            yName: 'Girl Names',
            label: {},
        },
        {
            data: data.filter((d) => d.gender === 'Boy'),
            type: 'scatter',
            xKey: 'popularity',
            xName: 'Popularity',
            yKey: 'trend',
            yName: 'Boy Names',
            labelKey: 'name',
            labelName: 'Name',
            label: {},
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
