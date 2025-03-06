import { Page, test as base, expect } from '@playwright/test';

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
        };

        Object.assign(page, proxiedProps);

        use(page);
    },
});

export { expect };
