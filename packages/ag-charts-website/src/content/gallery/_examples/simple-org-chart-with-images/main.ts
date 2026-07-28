import {
    AgChartOptions,
    AgCharts,
    AgCssColorOrRef,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const statusStyles: Record<string, { fill: string; color: string }> = {
    Remote: { fill: '#efebf3', color: '#603c88' },
    'In Office': { fill: '#e8efea', color: '#1e652e' },
    Hybrid: { fill: '#edf3fb', color: '#2b5c95' },
};

const mixForeground = (mix: number): AgCssColorOrRef => ({ ref: 'foregroundColor', mix, onto: 'backgroundColor' });

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Team Directory with Working Status',
    },
    data: getData(),
    initialState: {
        collapsed: [
            'Jeffrey Brown',
            'Justin Contreras',
            'Priya Nair',
            'Lawrence Martinez',
            'Devin Pittman',
            'Hannah Lee',
            'Cynthia Frank',
        ],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                image: {
                    key: 'avatar',
                    height: 60,
                    width: 60,
                    position: 'top',
                    cornerRadius: 30,
                },
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'job',
                    color: mixForeground(0.6),
                    formatter: ({ datum }) => [
                        {
                            text: ` ${datum.job}`,
                            fontStyle: 'italic',
                        },
                        {
                            text: `  •  `,
                        },
                        {
                            type: 'image',
                            url: datum.flag,
                            width: 16,
                            height: 12,
                            verticalAlign: 'middle',
                        },
                    ],
                },
                labels: [
                    {
                        key: 'status',
                        itemStyler: ({ datum }) => statusStyles[datum.status],
                        cornerRadius: 8,
                        padding: 4,
                        fontWeight: 'bold',
                        spacing: 8,
                    },
                ],
                padding: 12,
                cornerRadius: 4,
                fillOpacity: 0,
                strokeOpacity: 0.8,
                stroke: mixForeground(0.7),
            },
            expander: {
                text: {
                    color: mixForeground(0.7),
                    formatter: ({ allChildren, directChildren }) => {
                        const directs = directChildren === 1 ? '1 direct' : `${directChildren} directs`;
                        return `${directs} • ${allChildren} total`;
                    },
                },
                itemStyler: ({ isCollapsed }) => {
                    return { strokeWidth: isCollapsed ? 1 : 2 };
                },
            },
            link: {
                stroke: mixForeground(0.4),
            },
            highlight: {
                highlightedItem: {
                    strokeWidth: 2,
                    stroke: '#575757',
                },
            },
        },
    ],
};

AgCharts.create(options);
