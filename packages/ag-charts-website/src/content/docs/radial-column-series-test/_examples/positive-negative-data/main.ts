import { AgCharts, AgPolarChartOptions, ContextMenuModule } from 'ag-charts-enterprise';

import { DataType, getBaseData, getMixedSignData, getNegativeData } from './data';

let currentData: 'base' | 'negative' | 'mixed' = 'base';
let isStacked = false;

const options: AgPolarChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getBaseData(),
    animation: {
        enabled: false,
    },
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            stackGroup: undefined,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            stackGroup: undefined,
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
        },
        radius: {
            type: 'radius-number',
            nice: false,
        },
    },
    legend: {
        position: 'right',
    },
};

const chart = AgCharts.create(options);

function updateData() {
    switch (currentData) {
        case 'base':
            options.data = getBaseData();
            break;
        case 'negative':
            options.data = getNegativeData();
            break;
        case 'mixed':
            options.data = getMixedSignData();
            break;
    }
    chart.update(options as any);
}

function toggleRadiusReverse() {
    const radiusAxis = Object.values(options.axes ?? {}).find((axis: any) => axis.type === 'radius-number');
    if (radiusAxis) {
        radiusAxis.reverse = !radiusAxis.reverse;
        chart.update(options as any);
    }
}

function toggleAngleReverse() {
    const angleAxis = Object.values(options.axes ?? {}).find((axis: any) => axis.type === 'angle-category');
    if (angleAxis) {
        angleAxis.reverse = !angleAxis.reverse;
        chart.update(options as any);
    }
}

function toggleDataSign() {
    if (currentData === 'base') {
        currentData = 'negative';
    } else if (currentData === 'negative') {
        currentData = 'base';
    } else {
        currentData = 'base';
    }
    updateData();
}

function toggleMixedSign() {
    if (currentData === 'mixed') {
        currentData = 'base';
    } else {
        currentData = 'mixed';
    }
    updateData();
}

function toggleStacked() {
    isStacked = !isStacked;
    const stackGroup = isStacked ? 'stack' : undefined;

    if (options.series) {
        options.series.forEach((series: any) => {
            if (series.type === 'radial-column') {
                series.stackGroup = stackGroup;
            }
        });
    }
    chart.update(options as any);
}
