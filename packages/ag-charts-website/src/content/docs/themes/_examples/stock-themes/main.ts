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
    let theme = options.theme as AgChartThemeName;

    options.theme = theme.includes('-dark') ? 'ag-default-dark' : 'ag-default';

    AgCharts.update(chart, options);
}

function setThemeSheets() {
    let theme = options.theme as AgChartThemeName;

    options.theme = theme.includes('-dark') ? 'ag-sheets-dark' : 'ag-sheets';

    AgCharts.update(chart, options);
}

function setThemePolychroma() {
    let theme = options.theme as AgChartThemeName;

    options.theme = theme.includes('-dark') ? 'ag-polychroma-dark' : 'ag-polychroma';

    AgCharts.update(chart, options);
}

function setThemeVivid() {
    let theme = options.theme as AgChartThemeName;

    options.theme = theme.includes('-dark') ? 'ag-vivid-dark' : 'ag-vivid';

    AgCharts.update(chart, options);
}

function setThemeMaterial() {
    let theme = options.theme as AgChartThemeName;

    options.theme = theme.includes('-dark') ? 'ag-material-dark' : 'ag-material';

    AgCharts.update(chart, options);
}

function toggleDarkTheme() {
    let theme = options.theme as AgChartThemeName;

    options.theme = theme.includes('-dark')
        ? (theme.replace('-dark', '') as AgChartThemeName)
        : ((theme + '-dark') as AgChartThemeName);

    AgCharts.update(chart, options);
}
