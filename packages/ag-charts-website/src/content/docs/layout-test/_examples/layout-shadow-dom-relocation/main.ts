// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const pageContainer = document.getElementById('pageChart');
const shadowDomContainer = document.createElement('div');

const shadowContainer = document.getElementById('shadowDomChart');
shadowContainer?.attachShadow({ mode: 'open' });
shadowContainer?.shadowRoot?.appendChild(shadowDomContainer);

// Chart Options
const options: AgCartesianChartOptions = {
    container: shadowDomContainer,
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }],
};

const chart = AgCharts.create(options);

function toggleContainer() {
    if (options.container === pageContainer) {
        console.log('Moving INTO to shadow DOM');
        options.container = shadowDomContainer;
    } else if (options.container === shadowDomContainer) {
        console.log('Moving OUTSIDE of shadow DOM');
        options.container = pageContainer;
    }

    chart.update(options);
}
