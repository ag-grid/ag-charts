import type { ConsoleMessage, Locator, Page } from '@playwright/test';
import { execSync } from 'child_process';
import glob from 'glob';

import { expect, test } from './fixture';

const baseUrl = process.env.PUBLIC_SITE_URL ?? 'https://localhost:4600/charts';
const fws = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'] as const;

export const SELECTORS = {
    wrapper: '.ag-charts-wrapper',
    canvas: 'canvas',
    canvasProxy: '.ag-charts-canvas-proxy',
    canvasCenter: '.ag-charts-canvas-center',
    legendItems: 'button[role="switch"][class="ag-charts-proxy-elem"]',
    axisButton: '.ag-charts-annotations__axis-button',
    tooltip: '.ag-charts-tooltip',
    crosshairLabel: '.ag-charts-crosshair-label',
    focusIndicator: '.ag-charts-focus-indicator',
} as const;

export function getExamples() {
    const examples = glob.glob.sync('./src/content/**/_examples/*/main.ts').map((e) => ({ path: e, affected: true }));
    if (process.env.NX_BASE && process.env.AG_FORCE_ALL_TESTS !== '1') {
        const exampleGenChanged = execSync(
            `git diff --name-only ${process.env.NX_BASE} -- ../../plugins/ag-charts-generate-example-files/`
        )
            .toString()
            .split('\n')
            .some((t) => t.trim().length > 0);
        const changedFiles = new Set(
            execSync(`git diff --name-only ${process.env.NX_BASE} -- ./src/content/`)
                .toString()
                .split('\n')
                .map((v) => v.replace(/^packages\/ag-charts-website\//, './'))
        );
        let affectedCount = 0;
        for (const example of examples) {
            example.affected = exampleGenChanged || changedFiles.has(example.path);
            affectedCount += example.affected ? 1 : 0;
        }

        // eslint-disable-next-line no-console
        console.warn(`NX_BASE set - applied changed example processing, ${affectedCount} changed examples found.`);
    }
    return examples;
}

export function toPageUrl(uri: string) {
    return `${baseUrl}/${uri}`;
}

export function toExamplePageUrls(page: string, example: string) {
    return fws.map((framework) => ({ framework, url: `${baseUrl}/${framework}/${page}/examples/${example}`, example }));
}

export function toExamplePageUrl(page: string, example: string, framework: (typeof fws)[number]) {
    return { url: `${baseUrl}/${framework}/${page}/examples/${example}`, example };
}

export function toGalleryPageUrls(example: string) {
    return [{ framework: 'vanilla', url: `${baseUrl}/gallery/examples/${example}`, example }];
}

export function setupIntrinsicAssertions(
    testFn: {
        beforeEach: (fn: ({ page }: { page: Page }, testInfo: { title?: string }) => Promise<void>) => void;
        afterEach: (fn: () => void) => void;
    },
    opts: { viewportSize?: { width: number; height: number } } = {}
) {
    let consoleWarnOrErrors: string[] = [];
    const config = { ignore404s: false, ignoreConsoleWarnings: false };

    // Create setup functions that can be called with any test instance
    testFn.beforeEach(async ({ page }, testInfo) => {
        consoleWarnOrErrors = [];
        // Check if this is a 404 test by examining the test title
        config.ignore404s = testInfo?.title?.includes('should 404 on') ?? false;
        // Check if console warnings should be ignored for this test
        config.ignoreConsoleWarnings = testInfo?.title?.includes('[ignoreConsoleWarnings]') ?? false;

        if (opts?.viewportSize) {
            await page.setViewportSize(opts.viewportSize);
        }

        page.on('console', (msg: any) => {
            // We only care about warnings/errors.
            if (msg.type() !== 'warning' && msg.type() !== 'error') return;

            // We don't care about the AG Charts license error message.
            if (msg.text().startsWith('*')) return;

            // Ignore Firefox Quirks Mode warning.
            if (msg.text().includes('This page is in Quirks Mode')) return;

            // Ignore 404s when expected
            const notFoundMatcher = /the server responded with a status of 404/;
            if (msg.location().url.includes('/favicon.ico')) return;
            if (notFoundMatcher.test(msg.text())) {
                if (config.ignore404s) return;
                expect(`${msg.location().url} - ${msg.text()}`).not.toMatch(notFoundMatcher);
            }

            consoleWarnOrErrors.push(msg.text());
        });

        page.on('pageerror', (err: any) => {
            consoleWarnOrErrors.push(err.message);
        });
    });

    testFn.afterEach(() => {
        if (!config.ignoreConsoleWarnings) {
            expect(consoleWarnOrErrors).toHaveLength(0);
        }
    });

    return {
        ...config,
    };
}

export function createConsoleLogs() {
    const ignoreMessageRegexes = [
        // Vite messages
        /^\[vite].*/,
        // AG Charts license error message
        /^\*.*/,
    ];
    const consoleMsgs: string[] = [];
    const consoleErrors: string[] = [];
    const clear = () => {
        consoleMsgs.length = 0;
        consoleErrors.length = 0;
    };

    const onMsg = (msg: ConsoleMessage) => {
        const text = msg.text();
        const ignore = ignoreMessageRegexes.some((regex) => regex.test(text));
        if (ignore) {
            return;
        }
        if (msg.type() === 'error') {
            consoleErrors.push(text);
        }
        consoleMsgs.push(text);
    };

    test.beforeEach(({ page }) => {
        page.on('console', onMsg);
    });

    test.afterEach(({ page }) => {
        page.off('console', onMsg);
        clear();
    });

    return {
        clear,

        expectNoErrors() {
            expect(consoleErrors).toEqual([]);
        },

        async expectLogs(calls: string[]) {
            const expectedCount: number = calls.length;
            await expect
                .poll(() => consoleMsgs.length, { message: `Waiting for ${expectedCount} console logs` })
                .toBeGreaterThanOrEqual(expectedCount);
            expect(consoleMsgs).toEqual(calls);
        },

        getLogs() {
            return consoleMsgs;
        },
    };
}

export function repeat(repCount: number, fn: () => unknown) {
    for (let i = 0; i < repCount; i++) {
        fn();
    }
}

export async function gotoUrl(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    expect(await page.title()).not.toMatch(/Page Not Found/);
}

export async function gotoExample(
    page: Page,
    url: string,
    opts = { skipStabilityChecks: false, skipNetworkIdle: false }
) {
    await gotoUrl(page, url + '#e2e=true');

    if (opts.skipNetworkIdle) {
        await page.waitForLoadState('load');
    } else {
        await page.waitForLoadState('networkidle');
    }

    expect(await page.title()).not.toMatch(/Page Not Found/);

    // Wait for synchronous JS execution to complete before we start waiting
    // for <canvas/> to appear.
    await page.evaluate(() => 1);
    await expect(page.locator(SELECTORS.canvas).first()).toBeVisible({ timeout: 10_000 });
    for (const elements of await page.locator(SELECTORS.canvas).all()) {
        await expect(elements).toBeVisible();
    }

    if (opts.skipStabilityChecks) return;
    await waitForAllChartUpdates(page);
}

export async function waitForAllChartUpdates(page: Page) {
    for (const elements of await page.locator(SELECTORS.wrapper).all()) {
        const count: number = await elements.count();
        for (let i = 0; i < count; i++) {
            await expect(elements.nth(i)).toHaveAttribute('data-scene-renders', { timeout: 5_000 });
            await waitForChartUpdate(elements.nth(i));
        }
    }
}

export async function waitForChartUpdate(wrapper: Locator) {
    await expect(wrapper).toHaveAttribute('data-update-pending', 'false', { timeout: 5_000 });
    await expect(wrapper).toHaveAttribute('data-animating', 'false', { timeout: 5_000 });
}

export async function getAnimationTime(wrapper: Locator): Promise<number> {
    const timeAttr = await wrapper.getAttribute('data-animation-time-ms');
    return timeAttr ? parseFloat(timeAttr) : 0;
}

export async function expectAnimationOccurred(wrapper: Locator, minTimeMs: number = 10) {
    const animationTime = await getAnimationTime(wrapper);
    expect(animationTime).toBeGreaterThan(minTimeMs);
}

// The in-built `page.dragAndDrop()` methods do not trigger our canvas drag events
export async function dragCanvas(
    page: Page,
    start: { x: number; y: number },
    end: { x: number; y: number },
    options = { steps: 4 }
) {
    const { steps } = options;
    const point = await canvasToPageTransformer(page);
    let p = point(start.x, start.y);

    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    for (let step = 0; step < steps; step++) {
        const x = start.x + ((end.x - start.x) * step) / steps;
        const y = start.y + ((end.y - start.y) * step) / steps;
        p = point(x, y);
        await page.mouse.move(Math.round(p.x), Math.round(p.y));
    }
    await page.mouse.up();
}

export async function locateCanvas(page: Page) {
    const canvasElem = page.locator('canvas');
    const canvas = page.locator(SELECTORS.canvasProxy);
    const wrapper = page.locator(SELECTORS.wrapper);
    const width = Number(await canvasElem.getAttribute('width'));
    const height = Number(await canvasElem.getAttribute('height'));
    const bbox = await canvas.boundingBox();

    if ([width, height].some((n) => [-Infinity, 0, Infinity].includes(n) || Number.isNaN(n))) {
        throw new Error(`Invalid canvasDims: { width: ${width}, height: ${height} }`);
    }
    if (bbox == null) {
        throw new Error(`Invalid canvas bbox!`);
    }

    return { wrapper, canvas, width, height, bbox };
}

type PointTransformer = (x: number, y: number) => { x: number; y: number };

export async function canvasToPageTransformer(page: Page): Promise<PointTransformer> {
    const offset = await (await page.$(SELECTORS.canvasProxy))?.boundingBox();
    if (!offset) throw new Error("Couldn't get the canvas bbox");
    return (x: number, y: number) => {
        return { x: offset.x + x, y: offset.y + y };
    };
}

export async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
