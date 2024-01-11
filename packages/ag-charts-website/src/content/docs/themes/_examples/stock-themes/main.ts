import { AgChartOptions, AgChartThemeName, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-default',
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

const chart = AgCharts.create(options);

function setThemeDefault() {
    options.theme = 'ag-default';

    AgCharts.update(chart, options);
}

function setThemeSheets() {
    options.theme = 'ag-sheets';

    AgCharts.update(chart, options);
}

function setThemePolychroma() {
    options.theme = 'ag-polychroma';

    AgCharts.update(chart, options);
}

function setThemeVivid() {
    options.theme = 'ag-vivid';

    AgCharts.update(chart, options);
}

function setThemeMaterial() {
    options.theme = 'ag-material';

    AgCharts.update(chart, options);
}
