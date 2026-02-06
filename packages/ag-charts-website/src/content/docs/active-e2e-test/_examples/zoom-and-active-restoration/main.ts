// @ag-skip-fws
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions, AgChartState } from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Monthly Sales Data' },
    subtitle: {
        text: 'Zoomed to show Jan-Apr. Click button to pan to October and highlight it.',
    },
    data: [
        { month: 'Jan', sales: 120 },
        { month: 'Feb', sales: 145 },
        { month: 'Mar', sales: 132 },
        { month: 'Apr', sales: 178 },
        { month: 'May', sales: 156 },
        { month: 'Jun', sales: 189 },
        { month: 'Jul', sales: 201 },
        { month: 'Aug', sales: 167 },
        { month: 'Sep', sales: 195 },
        { month: 'Oct', sales: 220 },
        { month: 'Nov', sales: 245 },
        { month: 'Dec', sales: 280 },
    ],
    listeners: {
        activeChange: (ev) => {
            console.log(JSON.stringify(ev));
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Sales',
            id: 'sales',
        },
    ],
    zoom: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0, end: 0.35 },
        },
    },
};

const chart = AgCharts.create(options);
const version = chart.getState().version;

const DESIRED_STATE: Pick<AgChartState, 'zoom' | 'active'> = {
    zoom: {
        ratioX: { start: 0.65, end: 1.0 },
    },
    active: {
        activeItem: {
            type: 'series-node',
            seriesId: 'sales',
            itemId: 9,
        },
    },
};

function onUpdateDelta() {
    chart.updateDelta({ initialState: DESIRED_STATE });
}

function onSetState() {
    chart.setState({ version, ...DESIRED_STATE });
}

// For e2e testing:
(window as any).agE2E = { chart };
