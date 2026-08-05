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
        collapsed: ['Mr. Jeffrey Brown', 'Nathan Jones', 'Justin Contreras', 'Lawrence Martinez', 'Eric Jensen'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            link: {
                stroke: '#ff8833',
                strokeWidth: 2,
                lineDash: [8, 2],
                interpolation: { type: 'step', cornerRadius: 8 },
                itemStyler: ({ fromDatum }) => {
                    if (fromDatum.department === 'Technology') {
                        return { stroke: '#00994d' };
                    } else if (fromDatum.job === 'CEO') {
                        return { stroke: '#006f9b', strokeWidth: 4, lineDash: [] };
                    }
                },
            },
            node: {
                image: { key: 'avatar', position: 'left', height: 50, width: 50, cornerRadius: 25 },
                title: { key: 'name' },
                subtitle: { key: 'job' },
                labels: [{ key: 'location' }],
            },
        },
    ],
};

const chart = AgCharts.create(options);

function changeCornerRadius(event: any) {
    const value = Number(event.target.value);
    document.getElementById('cornerRadiusValue')!.innerHTML = String(value);
    (options.series![0] as AgOrganizationSeriesOptions).link!.interpolation = { type: 'step', cornerRadius: value };
    chart.update(options);
}
