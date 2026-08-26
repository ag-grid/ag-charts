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
    title: {
        text: 'Company Organisation',
    },
    data: getData(),
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            layout: {
                type: 'stacked',
                linkIndentation: 26,
                nodeIndentation: 26,
                stackAtDepth: 4,
            },
            node: {
                // clickToExpand: false,
                image: {
                    key: 'avatar',
                    height: 50,
                    width: 50,
                    position: 'left',
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

function updateLinkIndentation(event: any) {
    const value = Number(event.target?.value);
    (options.series![0] as AgOrganizationSeriesOptions).layout!.linkIndentation = value;
    document.getElementById('linkIndentationValue')!.innerHTML = String(value);
    chart.update(options);
}

function updateNodeIndentation(event: any) {
    const value = Number(event.target?.value);
    (options.series![0] as AgOrganizationSeriesOptions).layout!.nodeIndentation = value;
    document.getElementById('nodeIndentationValue')!.innerHTML = String(value);
    chart.update(options);
}

function updateStackAtDepth(event: any) {
    const value = Number(event.target?.value);
    (options.series![0] as AgOrganizationSeriesOptions).layout!.stackAtDepth = value;
    document.getElementById('stackAtDepthValue')!.innerHTML = String(value);
    chart.update(options);
}
