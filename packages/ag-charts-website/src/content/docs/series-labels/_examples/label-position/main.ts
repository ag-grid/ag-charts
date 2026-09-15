import {
    AgBarSeriesOptions,
    AgBubbleSeriesOptions,
    AgCartesianChartOptions,
    AgCharts,
    LegendModule,
} from 'ag-charts-community';
import {
    BarSeriesModule,
    BubbleSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgBarSeriesLabelPlacement, AgChartLabelCollisionPlacement } from 'ag-charts-types';

import { BarDataType, BubbleDataType, barData, bubbleData } from './data';

ModuleRegistry.registerModules([
    BubbleSeriesModule,
    BarSeriesModule,
    LegendModule,
    CategoryAxisModule,
    NumberAxisModule,
]);

type SeriesType = 'bubble' | 'bar' | 'bar-horizontal';

let spacing = 6;

function formatCurrency(value: number) {
    const sign = value < 0 ? '-' : '';
    return `${sign}$${Math.abs(value)}m`;
}

const options: AgCartesianChartOptions<BubbleDataType | BarDataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Weather Station Readings' },
    data: bubbleData,
    series: [
        {
            type: 'bubble',
            xKey: 'temperature',
            yKey: 'humidity',
            sizeKey: 'windSpeed',
            labelKey: 'station',
            maxSize: 60,
            label: {
                enabled: true,
                placement: 'top',
                spacing,
            },
        },
    ],
    axes: {
        x: { type: 'number', title: { text: 'Temperature (°C)' } },
        y: { type: 'number', title: { text: 'Humidity (%)' } },
    },
};

const chart = AgCharts.create(options);

type Placement =
    | AgChartLabelCollisionPlacement
    | AgChartLabelCollisionPlacement[]
    | AgBarSeriesLabelPlacement
    | AgBarSeriesLabelPlacement[];

function parsePlacement(value: string): Placement {
    const placements = value.split(/,\s*/g);
    return (placements.length > 1 ? placements : placements[0]) as Placement;
}

function setSeriesType(event: Event) {
    const seriesType = (event.target as HTMLInputElement).value as SeriesType;

    (document.getElementById('bubblePlacementGroup') as HTMLFieldSetElement).disabled = seriesType !== 'bubble';
    (document.getElementById('barPlacementGroup') as HTMLFieldSetElement).disabled = seriesType === 'bubble';

    const bubblePlacementSelect = document.getElementById('bubblePlacementSelect') as HTMLSelectElement;
    const barPlacementSelect = document.getElementById('barPlacementSelect') as HTMLSelectElement;
    let placement: Placement;

    if (seriesType === 'bubble') {
        options.title = { text: 'Weather Station Readings' };
        options.data = bubbleData;
        options.axes = {
            x: { type: 'number', title: { text: 'Temperature (°C)' } },
            y: { type: 'number', title: { text: 'Humidity (%)' } },
        };
        placement = parsePlacement(bubblePlacementSelect.value);
        options.series = [
            {
                type: 'bubble',
                xKey: 'temperature',
                yKey: 'humidity',
                sizeKey: 'windSpeed',
                labelKey: 'station',
                maxSize: 60,
                label: {
                    enabled: true,
                    placement: placement as AgChartLabelCollisionPlacement | AgChartLabelCollisionPlacement[],
                    spacing,
                },
            },
        ];
    } else {
        options.title = { text: 'Quarterly Profit Change ($m)' };
        options.data = barData;
        // direction: 'horizontal' swaps which axis carries the category vs the value
        options.axes =
            seriesType === 'bar-horizontal'
                ? {
                      y: { type: 'category' },
                      x: { type: 'number', title: { text: 'Profit Change ($m)' } },
                  }
                : {
                      x: { type: 'category' },
                      y: { type: 'number', title: { text: 'Profit Change ($m)' } },
                  };
        placement = parsePlacement(barPlacementSelect.value);
        options.series = [
            {
                type: 'bar',
                direction: seriesType === 'bar-horizontal' ? 'horizontal' : 'vertical',
                xKey: 'quarter',
                yKey: 'profitChange',
                label: {
                    enabled: true,
                    placement: placement as AgBarSeriesLabelPlacement | AgBarSeriesLabelPlacement[],
                    spacing,
                    truncate: false,
                    formatter: ({ value }) => formatCurrency(value),
                },
                tooltip: {
                    renderer: ({ datum }) => ({
                        data: [{ label: 'Profit Change', value: formatCurrency((datum as BarDataType).profitChange) }],
                    }),
                },
            },
        ];
    }

    chart.update(options);
    updateSpacingSlider(placement);
}

function setPlacement(value: string) {
    const placement = parsePlacement(value);
    const series = options.series![0] as AgBubbleSeriesOptions<BubbleDataType> | AgBarSeriesOptions<BarDataType>;
    series.label!.placement = placement;
    chart.update(options);
    updateSpacingSlider(placement);
}

function setSpacing(event: Event) {
    spacing = Number((event.target as HTMLInputElement).value);
    document.getElementById('spacingValue')!.textContent = String(spacing);
    const series = options.series![0] as AgBubbleSeriesOptions<BubbleDataType> | AgBarSeriesOptions<BarDataType>;
    series.label!.spacing = spacing;
    chart.update(options);
}

/** inScope */
function updateSpacingSlider(placement: Placement) {
    const isCentred = placement === 'inside' || placement === 'inside-center';
    (document.getElementById('spacingSlider') as HTMLInputElement).disabled = isCentred;
}
