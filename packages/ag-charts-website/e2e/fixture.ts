import { Page, test as base, expect } from '@playwright/test';
import path from 'path';
import { CacheRoute } from 'playwright-network-cache';

import { waitForChartUpdate } from './util';

function stabilityProxy(page: Page, instance: any) {
    return new Proxy(instance, {
        get(target, prop, receiver) {
            const value = target[prop];
            if (value instanceof Function) {
                return async function (...args: unknown[]) {
                    for (const locator of await page.locator('.ag-charts-wrapper').all()) {
                        await waitForChartUpdate(locator);
                    }
                    const result = target[prop].apply(this === receiver ? target : this, args);
                    for (const locator of await page.locator('.ag-charts-wrapper').all()) {
                        await waitForChartUpdate(locator);
                    }
                    return result;
                };
            }
            return value;
        },
    });
}

export const test = base.extend({
    page: ({ page }, use) => {
        const proxiedProps = {
            mouse: stabilityProxy(page, page.mouse),
            keyboard: stabilityProxy(page, page.keyboard),
            touchscreen: stabilityProxy(page, page.touchscreen),
        };

        Object.assign(page, proxiedProps);

        use(page);
    },
    contextPage: ({ page }, use) => {
        use(page);
    },
    cacheRoute: [
        async ({ page }, use) => {
            const cacheRoute = new CacheRoute(page, { baseDir: path.join(__dirname, '.network-cache') });
            await cacheRoute.ALL('https://cdn.jsdelivr.net/**');
            await use(cacheRoute);
        },
        { auto: true },
    ],
});

export { expect };
