import {
    AgChartOptions,
    AgCharts,
    AgOrganizationSeriesOptions,
    AgOrganizationSeriesOptionsNodeImagePosition,
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
            node: {
                image: { key: 'avatar', height: 50, width: 50, position: 'left', cornerRadius: 25 },
                title: { key: 'name' },
                subtitle: { key: 'job' },
                labels: [{ key: 'location' }],
            },
        },
    ],
};

const chart = AgCharts.create(options);

function changePosition(position: AgOrganizationSeriesOptionsNodeImagePosition) {
    (options.series![0] as AgOrganizationSeriesOptions).node!.image!.position = position;
    chart.update(options);
}

function changeCornerRadius(event: any) {
    const value = Number(event.target.value);
    document.getElementById('cornerRadiusValue')!.innerHTML = String(value);
    (options.series![0] as AgOrganizationSeriesOptions).node!.image!.cornerRadius = value;
    chart.update(options);
}
