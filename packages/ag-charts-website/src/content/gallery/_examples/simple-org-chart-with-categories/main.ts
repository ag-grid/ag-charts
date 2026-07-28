import {
    AgChartOptions,
    AgCharts,
    AgOrganizationSeriesNodeTextStyle,
    AgOrganizationSeriesNodeTextStylerParams,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const familyColors: Record<string, string> = {
    platform: '#1D6FA4', // NexusCloud Platform
    infrastructure: '#E76F51', // Infrastructure
    'data & analytics': '#2A9D8F', // Data & Analytics
    'ai & ml': '#7B5EA7', // AI & ML
};

function textStyler({ datum, depth }: AgOrganizationSeriesNodeTextStylerParams): AgOrganizationSeriesNodeTextStyle {
    if (depth <= 2) return { color: '#fff' };
    return {
        color: { ref: 'foregroundColor', mix: 0.75, onto: 'backgroundColor' },
        fontStyle: datum.status === 'beta' ? 'italic' : 'normal',
    };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Product Families',
    },
    data: getData(),
    initialState: {
        collapsed: ['Compute', 'Storage', 'Databases', 'Model Training'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                maxWidth: 160,
                title: {
                    key: 'name',
                    textAlign: 'center',
                    itemStyler: textStyler,
                },
                cornerRadius: 4,
                itemStyler: ({ datum, depth }) => {
                    const color = familyColors[datum.productFamily];
                    return {
                        fill: color,
                        stroke: color,
                        lineDash: datum.status === 'beta' ? [6, 2] : [],
                        fillOpacity: depth <= 2 ? 1 : 0.2,
                    };
                },
                clickToExpand: false,
            },
            expander: {
                strokeWidth: 2,
                itemStyler: ({ datum }) => {
                    const color = familyColors[datum.productFamily];
                    return { stroke: color, text: { color } };
                },
            },
            link: {
                itemStyler: ({ fromDatum }) => ({
                    stroke: familyColors[fromDatum.productFamily],
                    lineDash: fromDatum.status === 'beta' ? [6, 2] : [],
                }),
            },
            direction: 'horizontal',
            highlight: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
