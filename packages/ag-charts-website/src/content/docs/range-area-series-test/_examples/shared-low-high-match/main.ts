// @ag-skip-fws
import { AgChartOptions, AgCharts, AgRangeAreaSeriesThemeableOptions } from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

type ItemStyle = Pick<
    AgRangeAreaSeriesThemeableOptions,
    'marker' | 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset'
>;

const series0Style: ItemStyle = {
    lineDash: [4, 4],
    lineDashOffset: 5,
    stroke: 'blue',
    strokeWidth: 2.5,
    marker: {
        size: 30,
        fill: { type: 'gradient' },
    },
};
const series1Style: ItemStyle = {
    marker: {
        fill: 'lime',
        lineDash: [4, 4],
        lineDashOffset: 5,
        stroke: 'black',
        strokeOpacity: 0.5,
        strokeWidth: 6,
        size: 20,
    },
};
const series2Style: ItemStyle = {
    marker: {},
};
const series3Style: ItemStyle = {
    marker: {
        fill: { type: 'pattern', stroke: 'red' },
        size: 45,
        shape: 'star',
    },
};
const series4Style: ItemStyle = {
    marker: {
        fill: {
            type: 'image',
            backgroundFill: 'yellow',
            url: '${baseWWWUrl}/example-assets/docs-images/morningPeak.png',
        },
        size: 50,
        shape: 'square',
    },
};

let options: AgChartOptions = {
    container: document.getElementById('myChart'),
};

let chart: ReturnType<typeof AgCharts.create>;

function toggleLowHigh(lowHigh: boolean): void {
    function lowAndHigh(p: ItemStyle) {
        return { item: { low: p, high: p } };
    }
    function safeAs<T>(input: T): T {
        return input;
    }

    chart?.destroy();
    chart = AgCharts.create({
        ...safeAs<{ container?: HTMLElement | null }>(options),
        animation: { enabled: false },
        data: getData(),
        legend: { item: { line: { length: 50 } } },
        series: [
            {
                type: 'range-area',
                xKey: 'month',
                yName: 'A',
                yLowKey: 'a_low',
                yHighKey: 'a_high',
                fill: 'cyan',
                ...(lowHigh ? lowAndHigh(series0Style) : series0Style),
            },
            {
                type: 'range-area',
                xKey: 'month',
                yName: 'B',
                yLowKey: 'b_low',
                yHighKey: 'b_high',
                fill: 'magenta',
                fillOpacity: 0.5,
                ...(lowHigh ? lowAndHigh(series1Style) : series1Style),
            },
            {
                type: 'range-area',
                xKey: 'month',
                yName: 'C',
                yLowKey: 'c_low',
                yHighKey: 'c_high',
                ...(lowHigh ? lowAndHigh(series2Style) : series2Style),
            },
            {
                type: 'range-area',
                xKey: 'month',
                yName: 'D',
                yLowKey: 'd_low',
                yHighKey: 'd_high',
                ...(lowHigh ? lowAndHigh(series3Style) : series3Style),
            },
            {
                type: 'range-area',
                xKey: 'month',
                yName: 'E',
                yLowKey: 'e_low',
                yHighKey: 'e_high',
                ...(lowHigh ? lowAndHigh(series4Style) : series4Style),
            },
        ],
    } satisfies AgChartOptions<DatumType>);
}

toggleLowHigh(false);
