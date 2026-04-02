// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [],
    loading: false,
    navigator: { enabled: true },
    zoom: { enabled: true },
    series: [{ type: 'line', xKey: 'time', yKey: 'price', yName: 'Price' }],
    axes: { x: { type: 'unit-time', unit: 'day' } },
};

const chart = AgCharts.create(options);

function loadData() {
    chart.updateDelta({ loading: true });
    FakeServer.get({}).then((data) => {
        chart.updateDelta({ loading: false, data });
    });
}
