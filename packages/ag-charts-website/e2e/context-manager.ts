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
        const openPages = context.pages().filter((page) => !page.isClosed());
        const [primary, ...additional] = openPages;

        // Close stray tabs to keep the window count stable.
        await Promise.all(additional.map((page) => page.close()));

        if (primary && !primary.isClosed()) {
            try {
                await primary.goto('about:blank', { waitUntil: 'load' });
            } catch {
                // Ignore navigation failures; the next test will navigate anyway.
            }
        }

        await context.clearCookies();
        await context.clearPermissions();
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

    page: [
        async ({ sharedContext }, use) => {
            const openPages = sharedContext.pages().filter((p) => !p.isClosed());
            const page = openPages.length > 0 ? openPages[0] : await sharedContext.newPage();

            // Ensure we only keep a single visible tab to avoid extra windows.
            await Promise.all(openPages.slice(1).map((p) => p.close()));

            if (page.url() === 'about:blank') {
                try {
                    await page.waitForLoadState('domcontentloaded');
                } catch {
                    // Page might have been mid-navigation; tests will drive it regardless.
                }
            }

            // Apply stability proxies once per page instance.
            if (!(page as any)._agStabilityPatched) {
                const proxiedProps = {
                    mouse: stabilityProxy(page, page.mouse),
                    keyboard: stabilityProxy(page, page.keyboard),
                    touchscreen: stabilityProxy(page, page.touchscreen),
                };
                Object.assign(page, proxiedProps);
                (page as any)._agStabilityPatched = true;
            }

            // Setup cache route once per page instance.
            if (!(page as any)._agCacheRoute) {
                const cacheRoute = new CacheRoute(page, { baseDir: path.join(__dirname, '.network-cache') });
                await cacheRoute.ALL('https://cdn.jsdelivr.net/**');
                (page as any)._agCacheRoute = cacheRoute;
            }

            await use(page);

            try {
                if (!page.isClosed()) {
                    // Return to a neutral state for the next test.
                    await page.goto('about:blank', { waitUntil: 'load' });
                }
            } catch {
                // Ignore navigation failures; pool reset will handle recovery.
            }
        },
        { scope: 'test' },
    ],

    contextPage: [
        async ({ page }, use) => {
            await use(page);
        },
        { scope: 'test' },
    ],
});

// Worker cleanup
test.afterAll(async () => {
    await cleanupContextPool();
});
