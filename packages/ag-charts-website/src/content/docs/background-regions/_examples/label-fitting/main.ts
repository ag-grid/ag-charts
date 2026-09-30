import {
    AgCartesianChartOptions,
    AgCharts,
    AgSeriesAreaBackgroundRegionLabel,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);

const label: AgSeriesAreaBackgroundRegionLabel = {
    text: 'Drought Risk: Water Restrictions in Place',
    position: 'inside-top',
    maxWidth: 120,
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Reservoir Capacity',
    },
    seriesArea: {
        backgroundRegions: [
            {
                xRange: { start: new Date(2025, 5, 1), end: new Date(2025, 8, 1) },
                yRange: { start: 20, end: 50 },
                label,
            },
        ],
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'capacity',
            yName: 'Capacity',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
            title: {
                text: 'Capacity (%)',
            },
        },
    },
};

const chart = AgCharts.create(options);

function setLabelFit(fit: Partial<AgSeriesAreaBackgroundRegionLabel>) {
    options.seriesArea!.backgroundRegions![0].label = { ...label, ...fit };
    chart.update(options);
}

function wrap() {
    setLabelFit({});
}

function truncate() {
    setLabelFit({ wrapping: 'never', truncate: true });
}

function shrink() {
    setLabelFit({ wrapping: 'never', minimumFontSize: 8 });
}
