import { AreaSeriesModule, LegendModule, ModuleRegistry, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';
import { AgCharts, AgSparklineOptions, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    TimeAxisModule,
    ZoomModule,
]);

const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    type: 'area',
    data: data,
    xKey: 'date',
    yKey: 'price',
    axis: {
        type: 'time',
    },
    tooltip: {
        renderer: ({ yValue }) => ({
            content: `$${yValue.toFixed(2)}`,
        }),
    },
};

const chart = AgCharts.__createSparkline(options);

function updateChart() {
    const lastDate = data[data.length - 1].date;
    const lastPrice = data[data.length - 1].price;
    const newDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    const priceChange = (Math.random() - 0.5) * 10;
    const newPrice = Math.max(100, Math.min(200, lastPrice + priceChange));

    data.push({ date: newDate, price: newPrice });

    if (data.length > 10) {
        data.shift();
    }

    chart.updateDelta({ data: [...data] });
}
