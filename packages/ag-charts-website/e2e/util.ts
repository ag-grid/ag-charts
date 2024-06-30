import { Page, expect, test } from '@playwright/test';
import { execSync } from 'child_process';
import glob from 'glob';

const baseUrl = 'http://localhost:4601';
const fws = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'];

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
    await page.waitForLoadState('domcontentloaded');

    expect(await page.title()).not.toMatch(/Page Not Found/);

    // Wait for synchronous JS execution to complete before we start waiting
    // for <canvas/> to appear.
    await page.evaluate(() => 1);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10_000 });
    for (const elements of await page.locator('canvas').all()) {
        await expect(elements).toBeVisible();
    }
    for (const elements of await page.locator('.ag-charts-wrapper').all()) {
        await expect(elements).toHaveAttribute('data-scene-renders', { timeout: 5_000 });
    }
}
