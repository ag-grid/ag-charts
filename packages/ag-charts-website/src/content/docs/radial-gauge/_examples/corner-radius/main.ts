import { AgCharts, AgRadialGaugeOptions } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';

import { AllGaugeModule } from 'ag-charts-enterprise';
ModuleRegistry.registerModules([AllGaugeModule]);
const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    cornerRadius: 99,
    cornerMode: 'container',
    segmentation: {
        enabled: false,
        interval: {
            count: 4,
        },
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);

function setCornerMode(cornerMode: 'container' | 'item') {
    options.cornerMode = cornerMode;
    chart.update(options);
}

function setSegmentation(segmented: boolean) {
    options.segmentation!.enabled = segmented;
    chart.update(options);
}
