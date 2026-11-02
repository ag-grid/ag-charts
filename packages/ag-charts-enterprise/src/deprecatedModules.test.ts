import { afterEach, beforeEach, describe, it } from 'vitest';

import {
    type AgChartOptions,
    AgCharts,
    AllCartesianModule as AllCommunityCartesianModule,
    AllPolarModule as AllCommunityPolarModule,
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
} from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { type ModuleDefinition, ModuleRegistry } from 'ag-charts-core';

import { AxisInteractionModule } from './module-bundles/axis-interaction';
import { AllCartesianModule } from './module-bundles/cartesian';
import { AllGaugeModule } from './module-bundles/gauge';
import { AllPolarModule } from './module-bundles/polar';
import { AllMapSeriesModule } from './module-bundles/topology';
import { createEnterpriseChart, prepareEnterpriseTestOptions } from './test/utils';

const data = [
    { category: 'A', low: 1, open: 2, close: 3, high: 4 },
    { category: 'B', low: 2, open: 3, close: 4, high: 5 },
];
const bar: AgChartOptions = { data, series: [{ type: 'bar', xKey: 'category', yKey: 'high' }] };
const pie: AgChartOptions = { data, series: [{ type: 'pie', angleKey: 'high', legendItemKey: 'category' }] };
const radar: AgChartOptions = { data, series: [{ type: 'radar-line', angleKey: 'category', radiusKey: 'high' }] };
const axisListener: AgChartOptions = {
    data,
    series: [{ type: 'bar', xKey: 'category', yKey: 'high' }],
    axes: { x: { type: 'category', listeners: { click() {} } } },
};
const candlestickWithFeatures: AgChartOptions = {
    data,
    series: [
        { type: 'candlestick', xKey: 'category', openKey: 'open', closeKey: 'close', highKey: 'high', lowKey: 'low' },
    ],
    axes: {
        x: { type: 'category', listeners: { click() {} } },
        y: { type: 'number', crossLines: [{ type: 'line', value: 3 }] },
    },
    legend: { enabled: true },
    locale: { localeText: {} },
    zoom: { enabled: true },
    seriesArea: { backgroundRegions: [{ xRange: { start: 'A', end: 'B' } }] },
};
const mapShape: AgChartOptions = {
    data: [{ id: 'A', value: 1 }],
    topology: {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { name: 'A' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 0],
                        ],
                    ],
                },
            },
        ],
    },
    series: [{ type: 'map-shape', idKey: 'id', colorKey: 'value' }],
};

// `setupMockConsole` fails each case on any console output, which is how a missing module reports.
describe('deprecated module exports', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: { destroy(): void } | undefined;
    let registeredModules: ModuleDefinition[];

    function registerOnly(modules: ModuleDefinition[]) {
        ModuleRegistry.reset();
        ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.Enterprise);
        ModuleRegistry.registerModules(modules);
    }

    beforeEach(() => {
        registeredModules = [...ModuleRegistry.listModules()];
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        registerOnly(registeredModules);
    });

    it.each<[string, ModuleDefinition[], AgChartOptions]>([
        ['community AllCartesianModule', AllCommunityCartesianModule, bar],
        ['community AllPolarModule', AllCommunityPolarModule, pie],
        ['enterprise AllCartesianModule', AllCartesianModule, candlestickWithFeatures],
        ['enterprise AllPolarModule', AllPolarModule, radar],
        ['AllMapSeriesModule', AllMapSeriesModule, mapShape],
        [
            'AxisInteractionModule',
            [BarSeriesModule, CategoryAxisModule, NumberAxisModule, AxisInteractionModule],
            axisListener,
        ],
    ])('%s still registers what its chart needs', async (_name, modules, options) => {
        registerOnly(modules);

        chart = await createEnterpriseChart(options);
    });

    it('AllGaugeModule still registers what its chart needs', async () => {
        registerOnly(AllGaugeModule);

        // Bespoke: the shared factories cannot create gauges.
        const gauge = AgCharts.createGauge(
            prepareEnterpriseTestOptions({ type: 'radial-gauge', value: 5, scale: { min: 0, max: 10 } })
        );
        chart = gauge;
        await waitForChartStability(gauge);
    });
});
