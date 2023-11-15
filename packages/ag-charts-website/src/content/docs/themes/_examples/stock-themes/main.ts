import { AgCharts, AgChartOptions, AgChartThemeName } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-default-dark',
    title: {
        text: 'Chart Theme Example',
    },
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
        },
    ],
};

var chart = AgCharts.create(options);

function applyTheme(theme: AgChartThemeName) {
    options.theme = theme;

    AgCharts.update(chart, options);
}

document.getElementById('theme-select')?.addEventListener('input', (event) => {
    applyTheme((event.target as HTMLInputElement).value as AgChartThemeName);
});
