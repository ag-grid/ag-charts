import { Page, expect, test } from '@playwright/test';
import { execSync } from 'child_process';
import glob from 'glob';

const baseUrl = process.env.PUBLIC_SITE_URL;
const fws = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'] as const;

export const SELECTORS = {
    canvas: '.ag-charts-canvas-proxy',
    canvasCenter: '.ag-charts-canvas-center',
    legendItem0: '#ag-charts-legend-item-0',
    legendItem1: '#ag-charts-legend-item-1',
    legendItem2: '#ag-charts-legend-item-2',
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

export function toExamplePageUrls(page: string, example: string) {
    return fws.map((framework) => ({ framework, url: `${baseUrl}/${framework}/${page}/examples/${example}`, example }));
}

export function toExamplePageUrl(page: string, example: string, framework: (typeof fws)[number]) {
    return { url: `${baseUrl}/${framework}/${page}/examples/${example}`, example };
}

export function toGalleryPageUrls(example: string) {
    return [{ framework: 'vanilla', url: `${baseUrl}/gallery/examples/${example}`, example }];
}

export function setupIntrinsicAssertions() {
    let consoleWarnOrErrors: string[] = [];
    const config = { ignore404s: false, ignoreConsoleWarnings: false };

    test.beforeEach(({ page }) => {
        consoleWarnOrErrors = [];
        config.ignore404s = false;
        config.ignoreConsoleWarnings = false;

        page.on('console', (msg) => {
            // We only care about warnings/errors.
            if (msg.type() !== 'warning' && msg.type() !== 'error') return;

            // We don't care about the AG Charts license error message.
            if (msg.text().startsWith('*')) return;

            // Ignore 404s when expected
            const notFoundMatcher = /the server responded with a status of 404 \(Not Found\)/;
            if (msg.location().url.includes('/favicon.ico')) return;
            if (notFoundMatcher.test(msg.text())) {
                if (config.ignore404s) return;
                expect(`${msg.location().url} - ${msg.text()}`).not.toMatch(notFoundMatcher);
            }

            consoleWarnOrErrors.push(msg.text());
        });

        page.on('pageerror', (err) => {
            consoleWarnOrErrors.push(err.message);
        });
    });

    test.afterEach(() => {
        if (!config.ignoreConsoleWarnings) {
            expect(consoleWarnOrErrors).toHaveLength(0);
        }
    });

    return config;
}

export async function gotoExample(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    expect(await page.title()).not.toMatch(/Page Not Found/);

    // Wait for synchronous JS execution to complete before we start waiting
    // for <canvas/> to appear.
    await page.evaluate(() => 1);
    await expect(page.locator(SELECTORS.canvas).first()).toBeVisible();
    for (const elements of await page.locator(SELECTORS.canvas).all()) {
        await expect(elements).toBeVisible();
    }
    for (const elements of await page.locator('.ag-charts-wrapper').all()) {
        await expect(elements).toHaveAttribute('data-scene-renders', { timeout: 5_000 });
    }
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
    const canvas = page.locator(SELECTORS.canvas);
    const width = Number(await canvasElem.getAttribute('width'));
    const height = Number(await canvasElem.getAttribute('height'));
    const bbox = await canvas.boundingBox();

    if ([width, height].some((n) => [-Infinity, 0, Infinity].includes(n) || isNaN(n))) {
        throw new Error(`Invalid canvasDims: { width: ${width}, height: ${height} }`);
    }
    if (bbox == null) {
        throw new Error(`Invalid canvas bbox!`);
    }

    return { canvas, width, height, bbox };
}

type PointTransformer = (x: number, y: number) => { x: number; y: number };

export async function canvasToPageTransformer(page: Page): Promise<PointTransformer> {
    const offset = await (await page.$(SELECTORS.canvas)).boundingBox();
    if (!offset) throw new Error("Couldn't get the canvas bbox");
    return (x: number, y: number) => {
        return { x: offset.x + x, y: offset.y + y };
    };
}
