// @ag-skip-fws
import { AgChartOptions, AgCharts, ModuleRegistry, OrganizationSeriesModule, ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ZoomModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Reporting Hierarchy',
    },
    data: getData(),
    animation: { enabled: false },
    series: [
        {
            type: 'organization',
            id: 'org',
            idKey: 'id',
            parentIdKey: 'parentId',
            layout: { type: 'stacked', stackAtDepth: 5 },
            node: {
                maxWidth: 180,
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'title',
                },
            },
            expander: {
                text: {
                    showAllChildren: true,
                    showDirectChildren: true,
                },
            },
            // Organization tooltips are off by default; enabled here so the active item shows one.
            tooltip: {
                enabled: true,
            },
        },
    ],
    zoom: {
        buttons: {
            visible: 'zoomed',
        },
    },
};

const chart = AgCharts.create(options);
const version = chart.getState().version;

function onSetActive() {
    chart.setState({
        version,
        active: {
            activeItem: { type: 'series-node', seriesId: 'org', itemId: 'Priya Nair' },
        },
    });
}

function onClearActive() {
    chart.setState({ version, active: { activeItem: undefined } });
}
