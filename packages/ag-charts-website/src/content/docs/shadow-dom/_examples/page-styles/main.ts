import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Energy Output' },
    data: [
        { quarter: 'Q1', solar: 120, wind: 310 },
        { quarter: 'Q2', solar: 260, wind: 240 },
        { quarter: 'Q3', solar: 330, wind: 190 },
        { quarter: 'Q4', solar: 150, wind: 350 },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'solar', yName: 'Solar' },
        { type: 'bar', xKey: 'quarter', yKey: 'wind', yName: 'Wind' },
    ],
    enableShadowDom: false,
};

const chart = AgCharts.create(options);

function setShadowDom(event: Event) {
    options.enableShadowDom = (event.target as HTMLInputElement).value === 'shadow-root';
    chart.update(options);
}
