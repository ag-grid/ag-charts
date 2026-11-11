import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgChartInstance } from 'ag-charts-types';

import { setupEnterpriseModules } from '../setup';
import { getStockData } from './test/stockData';
import { getRegularVolumeProfile } from './test/volumeProfileData';

setupEnterpriseModules();

const NONCE = '416d1177';

const base = (container: HTMLElement) => ({ container, styleNonce: NONCE, width: 400, height: 300 });

// Bespoke: each preset has its own `AgCharts.create*` entrypoint, which the shared factories do not call.
const PRESETS: Array<[string, (container: HTMLElement) => AgChartInstance<any>]> = [
    ['linear gauge', (container) => AgCharts.createGauge({ ...base(container), type: 'linear-gauge', value: 50 })],
    ['radial gauge', (container) => AgCharts.createGauge({ ...base(container), type: 'radial-gauge', value: 50 })],
    [
        'quadrant',
        (container) =>
            AgCharts.createQuadrantChart({
                ...base(container),
                data: [
                    { x: -1, y: -1 },
                    { x: 1, y: 1 },
                ],
                xKey: 'x',
                yKey: 'y',
            }),
    ],
    [
        'price-volume',
        (container) => AgCharts.createFinancialChart({ ...base(container), data: getStockData().slice(0, 20) }),
    ],
    [
        'volume-profile',
        (container) =>
            AgCharts.createVolumeProfileChart({
                ...base(container),
                data: getRegularVolumeProfile(),
                upKey: 'upVolume',
                downKey: 'downVolume',
            }),
    ],
];

describe('preset styleNonce', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance<any> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each(PRESETS)('applies the nonce to every injected style element for the %s preset', async (_name, create) => {
        // A detached container keeps the styles inside this chart's own DOM rather than the shared, per-document
        // `<head>` stylesheet, so each case only sees the style elements its own chart injected.
        const container = document.createElement('div');
        chart = create(container);
        await waitForChartStability(chart);

        const styles = Array.from(container.querySelectorAll('style'));
        expect(styles.length).toBeGreaterThan(0);
        expect(styles.map((style) => style.getAttribute('nonce'))).toEqual(styles.map(() => NONCE));
    });
});
