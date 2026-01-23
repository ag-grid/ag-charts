// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { getData1, getData2 } from './data';
import type { DatumType } from './data';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const maxSize = 100;
const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Feature Performance Bubble Chart',
    },
    series: [
        {
            type: 'bubble',
            title: 'iOS',
            data: getData1(),
            xKey: 'sessionMinutes',
            yKey: 'crashRate',
            sizeKey: 'dau',
            labelKey: 'name',
            maxSize,
            fillOpacity: 0.35,
            strokeWidth: 1,
            tooltip: {
                renderer: ({ datum }) => ({
                    title: `iOS – ${datum.name}`,
                    data: [
                        { label: 'Avg Session', value: `${datum.sessionMinutes} min` },
                        { label: 'Crash Rate', value: `${datum.crashRate}%` },
                        { label: 'Daily Active Users', value: `${datum.dau}k` },
                    ],
                }),
            },
        },
        {
            type: 'bubble',
            title: 'Android',
            data: getData2(),
            xKey: 'sessionMinutes',
            yKey: 'crashRate',
            sizeKey: 'dau',
            labelKey: 'name',
            maxSize,
            fillOpacity: 0.35,
            strokeWidth: 1,
            tooltip: {
                renderer: ({ datum }) => ({
                    title: `Android – ${datum.name}`,
                    data: [
                        { label: 'Avg Session', value: `${datum.sessionMinutes} min` },
                        { label: 'Crash Rate', value: `${datum.crashRate}%` },
                        { label: 'Daily Active Users', value: `${datum.dau}k` },
                    ],
                }),
            },
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: { text: 'Average Session Duration (minutes)' },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Crash Rate (%)' },
        },
    },
    tooltip: {
        pagination: true,
    },
    legend: {
        position: 'right',
    },
};

const chart = AgCharts.create(options);

function onGetState(): void {
    setTimeout(() => console.log(chart.getState()), 1000);
}

// For e2e testing:
(window as any).agE2E = { chart };
