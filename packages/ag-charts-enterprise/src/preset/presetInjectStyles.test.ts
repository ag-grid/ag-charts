import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgChartInstance } from 'ag-charts-types';

import { setupEnterpriseModules } from '../setup';
import { PRESET_FACTORIES } from './test/presetFactories';

setupEnterpriseModules();

const CASES = {
    ...PRESET_FACTORIES,
    sparkline: (options: Record<string, unknown>) =>
        AgCharts.__createSparkline({ ...options, type: 'line', data: [1, 3, 2] }),
};

const injectStylesMode = (chart: AgChartInstance<any>) => deproxy(chart).ctx.domManager.injectStyles;

describe('preset injectStyles', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance<any> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    // A sparkline places its styles once attached, so a detached one shows only its mode.
    const expectStyles = (name: keyof typeof CASES, container: HTMLElement, injects: boolean) => {
        if (name === 'sparkline' && injects) return;
        expect(container.querySelectorAll('style').length > 0).toBe(injects);
    };

    // A detached container keeps each case's styles in its own DOM, and is never checked for a stylesheet.
    const create = async (name: keyof typeof CASES, options: Record<string, unknown>) => {
        const container = document.createElement('div');
        chart = CASES[name]({ container, width: 400, height: 300, ...options });
        await waitForChartStability(chart);
        return container;
    };

    const THEME = { overrides: { common: { injectStyles: false } } };

    describe.each(Object.keys(CASES) as Array<keyof typeof CASES>)('%s', (name) => {
        it.each([
            { description: 'unset', options: {}, injects: true },
            { description: 'true', options: { injectStyles: true }, injects: true },
            { description: 'false', options: { injectStyles: false }, injects: false },
            { description: 'false in the theme', options: { theme: THEME }, injects: false },
        ])('with injectStyles $description', async ({ options, injects }) => {
            const container = await create(name, options);

            expect(injectStylesMode(chart!)).toBe(injects);
            expectStyles(name, container, injects);
        });

        it('lets the chart option win over the theme', async () => {
            const container = await create(name, { injectStyles: true, theme: THEME });

            expect(injectStylesMode(chart!)).toBe(true);
            expectStyles(name, container, true);
        });
    });
});
