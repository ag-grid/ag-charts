import { Page, test as base, expect } from '@playwright/test';

function stabilityProxy(page: Page, instance: any) {
    return new Proxy(instance, {
        get(target, prop, receiver) {
            const value = target[prop];
            if (value instanceof Function) {
                return async function (...args) {
                    await expect(page.locator('.ag-charts-wrapper')).toHaveAttribute('data-update-pending', 'false');
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

export { expect } from '@playwright/test';
