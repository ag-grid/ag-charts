import { AgCharts, AgPolarChartOptions, PaddingSideOptions } from 'ag-charts-community';

import { getData } from './data';

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
            padding: { x: 32, y: 8 },
            marker: {
                padding: 8,
            },
        },
    },
};

const chart = AgCharts.create(options);

function updateLegendItemPaddingX(event: any) {
    const value = Number(event.target.value);

    (options.legend!.item!.padding as PaddingSideOptions).x = value;
    chart.update(options);

    document.getElementById('xPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemPaddingY(event: any) {
    const value = Number(event.target.value);

    (options.legend!.item!.padding as PaddingSideOptions).y = value;
    chart.update(options);

    document.getElementById('yPaddingValue')!.innerHTML = String(value);
}

function updateLegendMarkerPadding(event: any) {
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
