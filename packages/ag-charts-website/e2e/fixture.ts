import { Page, test as base, expect } from '@playwright/test';

import { waitForChartUpdate } from './util';

const LOCATOR_ACTIONS = new Set([
    'click',
    'dblclick',
    'tap',
    'fill',
    'press',
    'pressSequentially',
    'selectOption',
    'setChecked',
    'setInputFiles',
    'check',
    'uncheck',
    'hover',
    'focus',
    'blur',
    'dragTo',
]);

const LOCATOR_FACTORIES = new Set([
    'first',
    'last',
    'nth',
    'locator',
    'getByText',
    'getByRole',
    'getByLabel',
    'getByPlaceholder',
    'getByTestId',
    'getByTitle',
    'getByAltText',
    'filter',
    'and',
    'or',
]);

async function waitForCharts(page: Page) {
    // Wait for a rAF-then-setTimeout chain so that:
    // 1. rAF-scheduled chart updates (zoom animations, scene renders) begin
    // 2. Deferred DOM flushes (setTimeout(0) in DOMElementProxy) execute
    // Only after both have had a chance to fire do we inspect the stability
    // attributes, ensuring we don't read a stale "false" before an animation
    // has even been scheduled.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0))));
    for (const locator of await page.locator('.ag-charts-wrapper').all()) {
        await waitForChartUpdate(locator);
    }
}

function stabilityProxy(page: Page, instance: any) {
    return new Proxy(instance, {
        get(target, prop, receiver) {
            const value = target[prop];
            if (value instanceof Function) {
                return async function (...args: unknown[]) {
                    await waitForCharts(page);
                    const result = target[prop].apply(this === receiver ? target : this, args);
                    await waitForCharts(page);
                    return result;
                };
            }
            return value;
        },
    });
}

function stableLocator(page: Page, locator: any): any {
    for (const action of LOCATOR_ACTIONS) {
        if (typeof locator[action] === 'function') {
            const original = locator[action].bind(locator);
            locator[action] = async function (...args: unknown[]) {
                await waitForCharts(page);
                const result = await original(...args);
                await waitForCharts(page);
                return result;
            };
        }
    }

    for (const factory of LOCATOR_FACTORIES) {
        if (typeof locator[factory] === 'function') {
            const original = locator[factory].bind(locator);
            locator[factory] = function (...args: unknown[]) {
                return stableLocator(page, original(...args));
            };
        }
    }

    return locator;
}

const PAGE_LOCATOR_METHODS = [
    'locator',
    'getByText',
    'getByRole',
    'getByLabel',
    'getByPlaceholder',
    'getByTestId',
    'getByTitle',
    'getByAltText',
] as const;

export const test = base.extend({
    page: ({ page }, use) => {
        Object.assign(page, {
            mouse: stabilityProxy(page, page.mouse),
            keyboard: stabilityProxy(page, page.keyboard),
            touchscreen: stabilityProxy(page, page.touchscreen),
        });

        for (const method of PAGE_LOCATOR_METHODS) {
            const original = (page as any)[method].bind(page);
            (page as any)[method] = function (...args: unknown[]) {
                return stableLocator(page, original(...args));
            };
        }

        use(page);
    },
});

export { expect };
