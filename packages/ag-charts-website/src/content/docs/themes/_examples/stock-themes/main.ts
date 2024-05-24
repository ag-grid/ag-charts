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

    chart.update(options);
}

function setThemeSheets() {
    options.theme = 'ag-sheets';

    chart.update(options);
}

function setThemePolychroma() {
    options.theme = 'ag-polychroma';

    chart.update(options);
}

function setThemeVivid() {
    options.theme = 'ag-vivid';

    chart.update(options);
}

function setThemeMaterial() {
    options.theme = 'ag-material';

    chart.update(options);
}
