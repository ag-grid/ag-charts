import {
    AgCharts,
    AgStandaloneChartOptions,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Organisation',
    },
    data: getData(),
    initialState: {
        collapsed: ['cfo'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                image: {
                    key: 'avatar',
                    height: 50,
                    width: 50,
                    position: 'top',
                },
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'job',
                },
                labels: [
                    {
                        key: 'location',
                    },
                ],
            },
        },
    ],
};

const chart = AgCharts.create(options);

function expandAll() {
    const { version } = chart.getState();
    chart.setState({
        version,
        collapsed: [],
    });
}

function collapseCEO() {
    const { version, collapsed } = chart.getState();
    chart.setState({
        version,
        collapsed: [...(collapsed ?? []), 'ceo'],
    });
}

function toggleCTO() {
    const { version, collapsed: prev } = chart.getState();

    const collapsed = prev?.filter((id) => id !== 'cto');
    if (!prev?.includes('cto')) {
        collapsed?.push('cto');
    }

    chart.setState({ version, collapsed });
}

function toggleActiveEvePark() {
    const { version, active } = chart.getState();

    chart.setState({
        version,
        active: {
            activeItem: {
                type: 'series-node',
                seriesId: 'OrganizationSeries-1',
                itemId: 'qa',
            },
        },
    });
}
