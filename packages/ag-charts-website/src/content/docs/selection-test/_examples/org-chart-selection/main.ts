import {
    AgCharts,
    AgStandaloneChartOptions,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
    SelectionModule,
} from 'ag-charts-enterprise';
import type { AgSelectionContainment } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, SelectionModule, ContextMenuModule]);

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
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
            },
        },
    ],
    selection: {
        enabled: true,
        enableClick: true,
        enableDrag: true,
    },
};

const chart = AgCharts.create(options);

function onSelectionContainmentChange(containment: AgSelectionContainment) {
    options.selection!.containment = containment;
    chart.update(options);
}

function onGetSelectionClicked() {
    console.log(Array.from(chart.getSelection()));
}
