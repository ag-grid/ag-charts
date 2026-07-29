import { AgBubbleSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BubbleSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, data } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Weather Station Readings' },
    data,
    series: [
        {
            type: 'bubble',
            xKey: 'temperature',
            yKey: 'humidity',
            sizeKey: 'windSpeed',
            labelKey: 'station',
            label: {
                enabled: true,
                border: {
                    enabled: true,
                    stroke: { ref: 'foregroundColor', mix: 0.5, onto: 'backgroundColor' },
                    strokeWidth: 2,
                },
                collision: {
                    threshold: 4,
                    alwaysShow: false,
                },
            },
        },
    ],
    axes: {
        x: { type: 'number', title: { text: 'Temperature (°C)' } },
        y: { type: 'number', title: { text: 'Humidity (%)' } },
    },
};

const chart = AgCharts.create(options);

updateThresholdSlider();

function setThreshold(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('thresholdValue')!.textContent = String(value);
    (options.series![0] as AgBubbleSeriesOptions<DataType>).label!.collision!.threshold = value;
    chart.update(options);
}

function setAlwaysShow(value: string) {
    (options.series![0] as AgBubbleSeriesOptions<DataType>).label!.collision!.alwaysShow = value === 'show';
    chart.update(options);
    updateThresholdSlider();
}

/** inScope */
function updateThresholdSlider() {
    const series = options.series![0] as AgBubbleSeriesOptions<DataType>;
    (document.getElementById('thresholdSlider') as HTMLInputElement).disabled = Boolean(
        series.label!.collision!.alwaysShow
    );
}
