import type { Page } from '@playwright/test';

import type { AgChartState } from 'ag-charts-types';

import { expect } from './fixture';
import { waitForChartUpdate } from './util';

export async function getChartState(page: Page): Promise<AgChartState> {
    const state = await page.evaluate(() => {
        const chart: unknown = (window as any)?.agE2E?.chart;
        if (!chart) {
            throw new Error('window.agE2E.chart is not defined');
        } else if (typeof chart !== 'object') {
            throw new Error('window.agE2E.chart is not an object');
        } else if (!('getState' in chart)) {
            throw new Error('window.agE2E.chart does not have getState property');
        } else if (typeof chart.getState !== 'function') {
            throw new Error('window.agE2E.chart.getState is not a function');
        }
        return chart.getState();
    });

    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
    return state;
}

export async function setChartState(page: Page, state: AgChartState): Promise<void> {
    await page.evaluate(
        async ({ newState }) => {
            const chart: unknown = (window as any)?.agE2E?.chart;
            if (!chart) {
                throw new Error('window.agE2E.chart is not defined');
            } else if (typeof chart !== 'object') {
                throw new Error('window.agE2E.chart is not an object');
            } else if (!('setState' in chart)) {
                throw new Error('window.agE2E.chart does not have setState property');
            } else if (typeof chart.setState !== 'function') {
                throw new Error('window.agE2E.chart.setState is not a function');
            }

            const setStateReturn = chart.setState(newState);
            if (!(setStateReturn instanceof Promise)) {
                throw new Error('window.agE2E.chart.setState did not return a Promise');
            }
            await setStateReturn;
        },
        { newState: state }
    );
    await waitForChartUpdate(page.locator('.ag-charts-wrapper'));
}

export async function evalPageFunction(page: Page, fnName: string): Promise<unknown> {
    return await page.evaluate((evalName) => {
        const fn: unknown = (window as any)?.agE2E?.[evalName];
        if (fn == null) {
            throw new Error(`window.agE2E.${evalName} is not defined`);
        } else if (typeof fn !== 'function') {
            throw new Error(`window.agE2E.${evalName} is not a function`);
        }
        return fn();
    }, fnName);
}
