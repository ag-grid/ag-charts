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
            innerSpacing: 20,
            outerSpacing: 40,
            depthSpacing: 52,
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

function changeInnerSpacing(event: any) {
    const value = Number(event.target.value);
    document.getElementById('innerSpacingValue')!.innerHTML = String(value);
    (options.series![0] as AgOrganizationSeriesOptions).innerSpacing = value;
    chart.update(options);
}

function changeOuterSpacing(event: any) {
    const value = Number(event.target.value);
    document.getElementById('outerSpacingValue')!.innerHTML = String(value);
    (options.series![0] as AgOrganizationSeriesOptions).outerSpacing = value;
    chart.update(options);
}

function changeDepthSpacing(event: any) {
    const value = Number(event.target.value);
    document.getElementById('depthSpacing')!.innerHTML = String(value);
    (options.series![0] as AgOrganizationSeriesOptions).depthSpacing = value;
    chart.update(options);
}
