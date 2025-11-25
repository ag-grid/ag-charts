import { AgCartesianChartOptions, AgCharts, AgContextMenuItem } from 'ag-charts-enterprise';

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
            if (params.showOn === 'legend-item') {
                return [
                    'download',
                    'separator',
                    // Custom implementation of 'toggle-series-visibility':
                    {
                        type: 'action',
                        showOn: 'legend-item',
                        label: params.visible ? `Hide ${params.seriesId}` : `Show ${params.seriesId}`,
                        action: () => updateVisibility(params.seriesId, !params.visible),
                    },
                    'toggle-other-series',
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
    chart.updateDelta(options);
}
