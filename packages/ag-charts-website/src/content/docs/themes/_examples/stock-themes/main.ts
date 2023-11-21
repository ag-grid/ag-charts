import { AgChartOptions, AgChartThemeName, AgCharts } from 'ag-charts-community';

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

const chart = AgCharts.create(options);

function setThemeDefault() {
    options.theme = options.theme.includes('-dark') ? 'ag-default-dark' : 'ag-default';

    AgCharts.update(chart, options);
}

function setThemeSheets() {
    options.theme = options.theme.includes('-dark') ? 'ag-sheets-dark' : 'ag-sheets';

    AgCharts.update(chart, options);
}

function setThemePolychroma() {
    options.theme = options.theme.includes('-dark') ? 'ag-polychroma-dark' : 'ag-polychroma';

    AgCharts.update(chart, options);
}

function setThemeVivid() {
    options.theme = options.theme.includes('-dark') ? 'ag-vivid-dark' : 'ag-vivid';

    AgCharts.update(chart, options);
}

function setThemeMaterial() {
    options.theme = options.theme.includes('-dark') ? 'ag-material-dark' : 'ag-material';

    AgCharts.update(chart, options);
}

function toggleDarkTheme() {
    options.theme = options.theme.includes('-dark') ? options.theme.replace('-dark', '') : options.theme + '-dark';

    AgCharts.update(chart, options);
}
