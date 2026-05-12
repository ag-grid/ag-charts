// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [],
    // @ts-expect-error undocumented option (hidden for 35.3, reinstated in 36.0)
    loading: false,
    navigator: { enabled: true },
    zoom: { enabled: true },
    series: [{ type: 'line', xKey: 'time', yKey: 'price', yName: 'Price' }],
    axes: { x: { type: 'unit-time', unit: 'day' } },
};

const chart = AgCharts.create(options);

function loadData() {
    // @ts-expect-error undocumented option (hidden for 35.3, reinstated in 36.0)
    chart.updateDelta({ loading: true });
    FakeServer.get({}).then((data) => {
        // @ts-expect-error undocumented option (hidden for 35.3, reinstated in 36.0)
        chart.updateDelta({ loading: false, data });
    });
}
