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
    return new Proxy(locator, {
        get(target, prop) {
            const value = target[prop];
            if (typeof value !== 'function') return value;

            if (LOCATOR_ACTIONS.has(prop as string)) {
                return async function (...args: unknown[]) {
                    await waitForCharts(page);
                    const result = await target[prop].apply(target, args);
                    await waitForCharts(page);
                    return result;
                };
            }

            if (LOCATOR_FACTORIES.has(prop as string)) {
                return function (...args: unknown[]) {
                    return stableLocator(page, target[prop].apply(target, args));
                };
            }

            // Pass through all other methods unchanged to preserve Playwright's
            // internal type checks (e.g. expect(locator).toBeVisible()).
            return value.bind(target);
        },
    });
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
