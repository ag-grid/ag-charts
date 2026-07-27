import {
    AgCharts,
    AgOrganizationSeriesOptions,
    AgStandaloneChartOptions,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Company Organisation' },
    data: getData(),
    initialState: {
        collapsed: ['Mr. Jeffrey Brown', 'Nicole Jones', 'Justin Contreras', 'Lawrence Martinez', 'Eric Jensen'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                image: { key: 'avatar', position: 'left', height: 50, width: 50, cornerRadius: 25 },
                title: { key: 'name' },
                subtitle: { key: 'job' },
                labels: [{ key: 'location' }],
                clickToExpand: true,
            },
        },
    ],
    listeners: {
        collapsedChange: ({ collapsed, expanded }) => {
            console.log(
                'collapsed:',
                collapsed.map((item) => item.itemId),
                'expanded:',
                expanded.map((item) => item.itemId)
            );
        },
    },
};

const chart = AgCharts.create(options);

function setClickToExpand(clickToExpand: boolean) {
    (options.series![0] as AgOrganizationSeriesOptions).node!.clickToExpand = clickToExpand;
    chart.update(options);
}

function expandAll() {
    const { version } = chart.getState();
    chart.setState({ version, collapsed: [] });
}

function collapseAll() {
    const { version } = chart.getState();
    chart.setState({
        version,
        collapsed: [
            'Joseph Howe',
            'Gary Garcia',
            'Mr. Jeffrey Brown',
            'Nicole Jones',
            'Justin Contreras',
            'Lawrence Martinez',
            'Eric Jensen',
        ],
    });
}

function toggleCTO() {
    const { version, collapsed: prev } = chart.getState();

    const collapsed = prev?.filter((id) => id !== 'Joseph Howe');
    if (!prev?.includes('Joseph Howe')) {
        collapsed?.push('Joseph Howe');
    }

    chart.setState({ version, collapsed });
}
