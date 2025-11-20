import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgChartTheme, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const paperTheme: AgChartTheme = {
    palette: {
        fills: ['#006f9b', '#ff7faa', '#00994d', '#ff8833', '#00a0dd'],
        strokes: ['#003f58', '#934962', '#004a25', '#914d1d', '#006288'],
    },
};

const oceanTheme: AgChartTheme = {
    palette: {
        fills: ['#072B6E', '#094890', '#0B6CA8', '#0C94B6', '#0DC9C9'],
        strokes: ['#051C48', '#073569', '#095686', '#097590', '#0A9999'],
    },
};

const neonTheme: AgChartTheme = {
    palette: {
        fills: ['#00ff1e', '#ff00dd', '#00fff7', '#8f00ff', '#ff0000'],
        strokes: ['#000'],
    },
};

const options: AgCartesianChartOptions = {
    theme: paperTheme,
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            strokeWidth: 2,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            strokeWidth: 2,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            strokeWidth: 2,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            strokeWidth: 2,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            strokeWidth: 2,
        },
    ],
};

const chart = AgCharts.create(options);

function useDefaultTheme() {
    delete options.theme;
    chart.update(options);
}

function usePaperTheme() {
    options.theme = paperTheme;
    chart.update(options);
}

function useOceanTheme() {
    options.theme = oceanTheme;
    chart.update(options);
}

function useNeonTheme() {
    options.theme = neonTheme;
    chart.update(options);
}
