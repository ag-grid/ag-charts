import { AgCharts, AgPolarChartOptions } from 'ag-charts-community';
import { LegendModule, ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
        },
    ],
    legend: {
        maxHeight: 200,
        item: {
            maxWidth: 130,
            padding: { top: 4, right: 16, bottom: 4, left: 16 },
            marker: {
                padding: 8,
            },
        },
    },
};

const chart = AgCharts.create(options);

function updateLegendItemPaddingLeft(event: any) {
    const value = Number(event.target.value);

    if (typeof options.legend!.item!.padding === 'object') {
        options.legend!.item!.padding!.left = value;
    }
    chart.update(options);

    document.getElementById('leftPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemPaddingRight(event: any) {
    const value = Number(event.target.value);

    if (typeof options.legend!.item!.padding === 'object') {
        options.legend!.item!.padding!.right = value;
    }
    chart.update(options);

    document.getElementById('rightPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemPaddingTop(event: any) {
    const value = Number(event.target.value);

    if (typeof options.legend!.item!.padding === 'object') {
        options.legend!.item!.padding!.top = value;
    }
    chart.update(options);

    document.getElementById('topPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemPaddingBottom(event: any) {
    const value = Number(event.target.value);

    if (typeof options.legend!.item!.padding === 'object') {
        options.legend!.item!.padding!.bottom = value;
    }
    chart.update(options);

    document.getElementById('bottomPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemSpacing(event: any) {
    const value = Number(event.target.value);

    options.legend!.item!.marker!.padding = value;
    chart.update(options);

    document.getElementById('markerPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemMaxWidth(event: any) {
    const value = Number(event.target.value);

    options.legend!.item!.maxWidth = value;
    chart.update(options);

    document.getElementById('maxWidthValue')!.innerHTML = String(value);
}
