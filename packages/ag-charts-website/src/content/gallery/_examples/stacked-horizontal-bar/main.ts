import {
    AgBarSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    BandHighlightModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BandHighlightModule, BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const data: any[] = getData();

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            bar: {
                series: {
                    stroke: 'transparent',
                    strokeWidth: 1,
                    cornerRadius: 4,
                    itemStyler: ({ datum, yKey }) => ({
                        fillOpacity: getOpacity(Math.abs(datum[yKey]), yKey, 0.5, 1),
                    }),
                    label: {
                        enabled: true,
                    },
                    tooltip: {
                        enabled: true,
                        renderer: (params: AgBarSeriesTooltipRendererParams<DataType>) => ({
                            heading: `${params.datum.year} ${params.yName?.split(' - ')[1] ?? ''}`,
                            data: [
                                {
                                    label: params.yName?.split(' - ')[0] ?? '',
                                    value: String(Math.abs(params.datum[params.yKey as keyof DataType] as number)),
                                },
                            ],
                        }),
                    },
                },
            },
        },
    },
    title: {
        text: 'Football Players Performance Analysis',
        spacing: 30,
    },
    footnote: {
        text: 'Source: UEFA Champions League Statistics 2013-2023',
        fontStyle: 'italic',
    },
    data,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'crWon',
            yName: 'Cristiano Ronaldo - Wins',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'lmWon',
            yName: 'Lionel Messi - Wins',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'kbWon',
            yName: 'Karim Benzema - Wins',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'crLost',
            yName: 'Cristiano Ronaldo - Losses',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'lmLost',
            yName: 'Lionel Messi - Losses',
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'year',
            yKey: 'kbLost',
            yName: 'Karim Benzema - Losses',
            stacked: true,
        },
    ],
    axes: {
        y: {
            type: 'category',
            interval: { values: [2013, 2018, 2023] },
            title: {
                text: 'Season',
            },
            line: {
                enabled: false,
            },
            bandHighlight: {
                enabled: true,
            },
            gridLine: {
                enabled: true,
            },
        },
        x: {
            type: 'number',
            nice: false,
            min: -40,
            max: 60,
            interval: { values: [0] },
            title: {
                text: 'Number of Games',
            },
            gridLine: {
                width: 2,
            },
            crossLines: [
                {
                    type: 'range',
                    range: [0, -40],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'LOSSES',
                        position: 'top',
                    },
                },
                {
                    type: 'range',
                    range: [0, 60],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'WINS',
                        position: 'top',
                    },
                },
            ],
        },
    },
    tooltip: {
        mode: 'shared',
        position: {
            placement: ['top', 'bottom'],
        },
    },
    legend: {
        enabled: false,
    },
    formatter: {
        x(params) {
            return `${Math.abs(params.value as number)}`;
        },
    },
};

function getOpacity(value: number, key: string, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: string) {
    const min = Math.min(...data.map((d) => Math.abs(d[key])));
    const max = Math.max(...data.map((d) => Math.abs(d[key])));
    return [min, max];
}

const map = (value: number, start1: number, end1: number, start2: number, end2: number) => {
    return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

AgCharts.create(options);
