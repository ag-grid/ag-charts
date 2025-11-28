import {
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';
import type { AgCartesianChartOptions, AgContextMenuItem } from 'ag-charts-types';

ModuleRegistry.registerModules([
    BarSeriesModule,
    NumberAxisModule,
    CategoryAxisModule,
    LegendModule,
    ContextMenuModule,
]);

type DatumType = { sector: string; nyse: number; lse: number; tyo: number };

const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Stock Investment Portfolio by Sector',
    },
    subtitle: {
        text: 'Allocation (%) by Market',
    },
    data: [
        { sector: 'Industrial', nyse: 28, lse: 22, tyo: 18 },
        { sector: 'Financial', nyse: 24, lse: 30, tyo: 20 },
        { sector: 'Energy', nyse: 20, lse: 18, tyo: 25 },
        { sector: 'Technology', nyse: 15, lse: 10, tyo: 12 },
        { sector: 'Healthcare', nyse: 8, lse: 13, tyo: 10 },
        { sector: 'Consumer Staples', nyse: 5, lse: 7, tyo: 15 },
    ],
    series: [
        {
            id: 'New York Stock Exchange',
            type: 'bar',
            xKey: 'sector',
            yKey: 'nyse',
            yName: 'NYSE',
        },
        {
            id: 'London Stock Exchange',
            type: 'bar',
            xKey: 'sector',
            yKey: 'lse',
            yName: 'LSE',
        },
        {
            id: 'Tokyo Stock Exchange',
            type: 'bar',
            xKey: 'sector',
            yKey: 'tyo',
            yName: 'TYO',
        },
    ],
    contextMenu: {
        getItems: (params): AgContextMenuItem[] | undefined => {
            if (params.showOn === 'series-node') {
                const xName = params.datum[params.xKey];
                return [
                    'defaults',
                    'separator',
                    // Dynamic Context Menu Item
                    {
                        type: 'action',
                        showOn: 'series-node',
                        label: `Log Datum "${params.seriesId} - ${xName}"`,
                        action: () => console.log(params.datum),
                    },
                ];
            }
        },
    },
};

const chart = AgCharts.create(options);

function updateVisibility(seriesId: string, visible: boolean) {
    for (const series of options.series!) {
        if (series.id === seriesId) {
            series.visible = visible;
        }
    }
    chart.update(options);
}
