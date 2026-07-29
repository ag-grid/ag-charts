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
                spacing: 6,
            },
        },
    ],
    axes: {
        x: { type: 'number', title: { text: 'Temperature (°C)' } },
        y: { type: 'number', title: { text: 'Humidity (%)' } },
    },
};

const chart = AgCharts.create(options);

function setSeriesType(seriesType: SeriesType) {
    document.getElementById('bubblePlacementRow')!.style.display = seriesType === 'bubble' ? '' : 'none';
    document.getElementById('barPlacementRow')!.style.display = seriesType === 'bubble' ? 'none' : '';

    if (seriesType === 'bubble') {
        options.title = { text: 'Weather Station Readings' };
        options.data = bubbleData;
        options.axes = {
            x: { type: 'number', title: { text: 'Temperature (°C)' } },
            y: { type: 'number', title: { text: 'Humidity (%)' } },
        };
        options.series = [
            {
                type: 'bubble',
                xKey: 'temperature',
                yKey: 'humidity',
                sizeKey: 'windSpeed',
                labelKey: 'station',
                maxSize: 60,
                label: { enabled: true, placement: 'top', spacing: 6 },
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
        options.series = [
            {
                type: 'bar',
                direction: seriesType === 'bar-horizontal' ? 'horizontal' : 'vertical',
                xKey: 'quarter',
                yKey: 'profitChange',
                label: {
                    enabled: true,
                    placement: 'outside-end',
                    spacing: 6,
                    truncate: false,
                    formatter: (params) => `$${params.value}m`,
                },
            },
        ];
    }

    chart.update(options);
    updateSpacingSlider();
}

function setPlacement(placement: string) {
    const series = options.series![0] as AgBubbleSeriesOptions<BubbleDataType> | AgBarSeriesOptions<BarDataType>;
    const placements = placement.split(/,\s*/g);
    series.label!.placement = (placements.length > 1 ? placements : placements[0]) as
        | AgChartLabelCollisionPlacement
        | AgChartLabelCollisionPlacement[]
        | AgBarSeriesLabelPlacement
        | AgBarSeriesLabelPlacement[];
    chart.update(options);
    updateSpacingSlider();
}

function setSpacing(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('spacingValue')!.textContent = String(value);
    const series = options.series![0] as AgBubbleSeriesOptions<BubbleDataType> | AgBarSeriesOptions<BarDataType>;
    series.label!.spacing = value;
    chart.update(options);
}

function updateSpacingSlider() {
    const series = options.series![0] as AgBubbleSeriesOptions<BubbleDataType> | AgBarSeriesOptions<BarDataType>;
    const placement = series.label!.placement;
    const isCentred = placement === 'inside' || placement === 'inside-center';
    (document.getElementById('spacingSlider') as HTMLInputElement).disabled = isCentred;
}
