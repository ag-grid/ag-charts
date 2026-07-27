import {
    AgCharts,
    AgOrganizationSeriesOptions,
    AgStandaloneChartOptions,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule]);

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Company Organisation' },
    data: getData(),
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                title: { key: 'name' },
                subtitle: { key: 'job' },
            },
            expander: {
                text: {
                    showAllChildren: true,
                    showDirectChildren: true,
                },
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setShowAllChildren(showAllChildren: boolean) {
    (options.series![0] as AgOrganizationSeriesOptions).expander!.text!.showAllChildren = showAllChildren;
    chart.update(options);
}

function setShowDirectChildren(showDirectChildren: boolean) {
    (options.series![0] as AgOrganizationSeriesOptions).expander!.text!.showDirectChildren = showDirectChildren;
    chart.update(options);
}
