import { afterEach, describe, expect, it } from 'vitest';

import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgChartInstance } from 'ag-charts-types';

import { setupEnterpriseModules } from '../setup';
import { PRESET_FACTORIES } from './test/presetFactories';

setupEnterpriseModules();

const NONCE = '416d1177';

describe('preset styleNonce', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance<any> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each(Object.entries(PRESET_FACTORIES))(
        'applies the nonce to every injected style element for the %s preset',
        async (_name, create) => {
            // A detached container keeps the styles inside this chart's own DOM rather than the shared, per-document
            // `<head>` stylesheet, so each case only sees the style elements its own chart injected.
            const container = document.createElement('div');
            chart = create({ container, styleNonce: NONCE, width: 400, height: 300 });
            await waitForChartStability(chart);

            const styles = Array.from(container.querySelectorAll('style'));
            expect(styles.length).toBeGreaterThan(0);
            expect(styles.map((style) => style.getAttribute('nonce'))).toEqual(styles.map(() => NONCE));
        }
    );
});
