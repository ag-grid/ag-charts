import { Browser, BrowserContext, Page, test } from '@playwright/test';
import path from 'path';
import { CacheRoute } from 'playwright-network-cache';

import { waitForChartUpdate } from './util';

// Stability proxy function from fixture.ts
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

export interface ContextPool {
    getContext(): Promise<BrowserContext>;
    releaseContext(context: BrowserContext): Promise<void>;
    cleanup(): Promise<void>;
}

export class WorkerContextPool implements ContextPool {
    private contexts: BrowserContext[] = [];
    private availableContexts: BrowserContext[] = [];
    private readonly browser: Browser;
    private readonly maxContexts: number;

    constructor(browser: Browser, maxContexts: number = 3) {
        this.browser = browser;
        this.maxContexts = maxContexts;
    }

    async getContext(): Promise<BrowserContext> {
        // Try to reuse an available context
        if (this.availableContexts.length > 0) {
            const context = this.availableContexts.pop()!;
            await this.resetContext(context);
            return context;
        }

        // Create a new context if we haven't reached the limit
        if (this.contexts.length < this.maxContexts) {
            const context = await this.browser.newContext({
                ignoreHTTPSErrors: true,
                viewport: {
                    width: 800,
                    height: 600,
                },
                hasTouch: true,
            });
            this.contexts.push(context);
            return context;
        }

        throw new Error('No available contexts');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async releaseContext(context: BrowserContext) {
        if (this.contexts.includes(context)) {
            this.availableContexts.push(context);
        }
    }

    private async resetContext(context: BrowserContext): Promise<void> {
        // Clear all pages in the context
        const pages = context.pages();
        await Promise.all(pages.map((page) => page.close()));
    }

    async cleanup(): Promise<void> {
        await Promise.all(this.contexts.map((context) => context.close()));
        this.contexts = [];
        this.availableContexts = [];
    }
}

// Global context pool per worker
let contextPool: ContextPool | null = null;

export function getContextPool(): ContextPool {
    if (!contextPool) {
        throw new Error('Context pool not initialized. Call initializeContextPool first.');
    }
    return contextPool;
}

export async function initializeContextPool(browser: Browser, maxContexts: number = 3): Promise<void> {
    if (contextPool) {
        await contextPool.cleanup();
    }
    contextPool = new WorkerContextPool(browser, maxContexts);
}

export async function cleanupContextPool(): Promise<void> {
    if (contextPool) {
        await contextPool.cleanup();
        contextPool = null;
    }
}

// Context-aware test fixture
export interface ContextTestFixture {
    sharedContext: BrowserContext;
    contextPage: Page;
}

export const contextTest = test.extend<ContextTestFixture>({
    sharedContext: [
        async ({ browser }, use) => {
            if (!contextPool) {
                await initializeContextPool(browser);
            }

            const context = await contextPool!.getContext();
            await use(context);
            await contextPool!.releaseContext(context);
        },
        { scope: 'test' },
    ],

    contextPage: [
        async ({ sharedContext }, use) => {
            const page = await sharedContext.newPage();

            // Apply stability proxies like in the original fixture
            const proxiedProps = {
                mouse: stabilityProxy(page, page.mouse),
                keyboard: stabilityProxy(page, page.keyboard),
                touchscreen: stabilityProxy(page, page.touchscreen),
            };
            Object.assign(page, proxiedProps);

            // Setup cache route
            const cacheRoute = new CacheRoute(page, { baseDir: path.join(__dirname, '.network-cache') });
            await cacheRoute.ALL('https://cdn.jsdelivr.net/**');

            await use(page);
            await page.close();
        },
        { scope: 'test' },
    ],
});

// Worker cleanup
test.afterAll(async () => {
    await cleanupContextPool();
});
