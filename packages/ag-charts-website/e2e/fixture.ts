import { Page, test as base, expect } from '@playwright/test';

function stabilityProxy(page: Page, instance: any) {
    return new Proxy(instance, {
        get(target, prop, receiver) {
            const value = target[prop];
            if (value instanceof Function) {
                return async function (...args: unknown[]) {
                    for (const elements of await page.locator('.ag-charts-wrapper').all()) {
                        const count: number = await elements.count();
                        for (let i = 0; i < count; i++) {
                            await expect(elements.nth(i)).toHaveAttribute('data-update-pending', 'false');
                            await expect(elements.nth(i)).toHaveAttribute('data-animating', 'false');
                        }
                    }
                    return target[prop].apply(this === receiver ? target : this, args);
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
