import {
    AgActiveChangeEvent,
    AgCharts,
    AgTopologyChartOptions,
    AgZoomEvent,
    AllEnterpriseModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgTopologyChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Map Shape Keyboard Pan' },
    data,
    topology,
    animation: { enabled: false },
    zoom: { enabled: true },
    initialState: { zoom: { ratioX: { start: 0, end: 0.3 }, ratioY: { start: 0.6, end: 0.9 } } },
    series: [{ type: 'map-shape', idKey: 'name', colorKey: 'gdp' }],
    listeners: {
        activeChange: (event: AgActiveChangeEvent<unknown, unknown>) => {
            events.push(event);
        },
        zoom: (event: AgZoomEvent) => {
            events.push(event);
        },
    },
};

const chart = AgCharts.create(options);
let events: unknown[] = [];

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
