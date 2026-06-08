import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    LegendModule,
    ModuleRegistry,
    TreemapSeriesModule,
} from 'ag-charts-enterprise';

import { TData, getData } from './data';

ModuleRegistry.registerModules([AnimationModule, LegendModule, TreemapSeriesModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'value',
            group: {
                label: {
                    fontSize: 14,
                    color: '#fff',
                },
            },
            tile: {
                label: {
                    formatter: ({ datum }) => {
                        const d = datum as TData;
                        return [
                            {
                                type: 'image',
                                url: `https://cdn.simpleicons.org/${d.slug}/ffffff`,
                                width: 36,
                                height: 36,
                                block: true,
                                padding: 6,
                                backgroundFill: 'rgba(0, 0, 0, 0.35)',
                                borderRadius: 8,
                            },
                            { text: d.name, fontWeight: 'bold', verticalAlign: 'middle' },
                            { text: `\n$${d.value}B`, color: 'rgba(0, 0, 0, 0.6)' },
                        ];
                    },
                    fontSize: 16,
                    minimumFontSize: 10,
                    spacing: 2,
                },
                secondaryLabel: { enabled: false },
            },
        },
    ],
    title: { text: 'Top Tech Brand Values, 2024' },
    subtitle: { text: 'Brand value in USD billions' },
};

AgCharts.create(options);
