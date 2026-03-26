import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Percentage of BrP and AmE Interpretation of NPs in Neutral Environments',
    },
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'plural_interpretation',
            yName: 'Plural Interpretation',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'plural_and_singular_interpretation',
            yName: 'Plural & Singular Interpretation',
            normalizedTo: 100,
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'singular_interpretation',
            yName: 'Singular Interpretation',
            normalizedTo: 100,
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
        },
    },
};

const chart = AgCharts.create(options);
