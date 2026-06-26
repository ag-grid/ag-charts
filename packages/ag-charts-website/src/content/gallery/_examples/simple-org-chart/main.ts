import {
    AgChartOptions,
    AgCharts,
    AgOrganizationSeriesNodeTextStyle,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const leadershipJobs = ['CEO', 'CTO', 'CPO', 'CFO/COO'];

const departmentColors: Record<string, string> = {
    Executive: '#2A9D8F',
    Technology: '#E76F51',
    Product: '#7B5EA7',
    'Finance & Operations': '#1D6FA4',
};

function textStyler({ datum }: { datum: any }): AgOrganizationSeriesNodeTextStyle {
    if (leadershipJobs.includes(datum.job)) return { color: '#fff' };
    return { color: { ref: 'foregroundColor', mix: 0.75, onto: 'backgroundColor' } };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Organisation',
    },
    data: getData(),
    initialState: {
        collapsed: ['Jeffrey Brown', 'Justin Contreras', 'Devin Pittman'],
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
                    position: 'left',
                    cornerRadius: 4,
                },
                title: {
                    key: 'name',
                    textAlign: 'left',
                    itemStyler: textStyler,
                },
                subtitle: {
                    key: 'job',
                    textAlign: 'left',
                    fontStyle: 'italic',
                    itemStyler: textStyler,
                },
                labels: [
                    {
                        key: 'location',
                        textAlign: 'left',
                        itemStyler: textStyler,
                        formatter: ({ datum }) => [
                            {
                                type: 'image',
                                url: datum.flag,
                                width: 16,
                                height: 12,
                                verticalAlign: 'middle',
                            },
                            { text: ` ${String(datum.location).toUpperCase()}` },
                        ],
                    },
                ],
                cornerRadius: 4,
                itemStyler: ({ datum }) => {
                    const color = departmentColors[datum.department];
                    const fillOpacity = leadershipJobs.includes(datum.job) ? 1 : 0.2;
                    return { fill: color, stroke: color, fillOpacity };
                },
            },
            expander: {
                itemStyler: ({ datum }) => {
                    const color = departmentColors[datum.department];
                    return { stroke: color, text: { color } };
                },
            },
            link: {
                lineDash: [6, 2],
                itemStyler: ({ fromDatum }) => ({ stroke: departmentColors[fromDatum.department] }),
            },
        },
    ],
};

AgCharts.create(options);
