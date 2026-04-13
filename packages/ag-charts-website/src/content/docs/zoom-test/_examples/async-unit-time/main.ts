// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { week } from './data';
import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([AllEnterpriseModule]);

let unit = 'day';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: async ({ windowStart, windowEnd }) => {
            const { data, granularity } = await FakeServer.get({ windowStart, windowEnd });
            if (granularity > week && unit !== 'day') {
                chart.updateDelta({ axes: { x: { unit: 'day' } } });
                unit = 'day';
            } else if (granularity <= week && unit !== 'hour') {
                chart.updateDelta({ axes: { x: { unit: 'hour' } } });
                unit = 'hour';
            }
            return data;
        },
    },
    navigator: { enabled: true },
    zoom: { enabled: true },
    series: [{ type: 'line', xKey: 'time', yKey: 'price', yName: 'Price' }],
    axes: { x: { type: 'unit-time', unit: 'day' } },
};

const chart = AgCharts.create(options);
