import { readFileSync } from 'fs';
import { join } from 'path';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, gotoUrl, toPageUrl } from './util';

// This is a smoke test suite: a page actually failing to load or render (checked via the
// assertions in each test, plus gotoUrl/gotoExample's own title/canvas checks) is the main
// way a test fails. The one other hard-fail signal is a genuinely enforced CSP violation —
// something the browser actively blocked — since that's a real, actionable break we need to
// know about immediately, distinct from routine console noise. Everything else (console
// errors/warnings, uncaught exceptions, dev-server hydration noise, and report-only CSP
// monitoring that hasn't blocked anything yet) is surfaced as a test annotation for
// visibility in reports without failing the test. This intentionally doesn't use the shared
// setupIntrinsicAssertions from util.ts — that helper's zero-tolerance behaviour is right for
// the feature-level e2e specs that use it, but wrong for a post-deploy smoke test.
const isCspIssue = (msg: string) => /Content-Security-Policy|Refused to (load|execute|connect)/i.test(msg);
// An actual enforced block, as opposed to a report-only policy that's merely being
// monitored ahead of enforcement. Enforced CSP violation messages vary in verb by
// directive ("Refused to load/execute/connect...", "Refused to apply inline style...",
// "Refused to frame...", "Refused to create a worker from...", "Refused to evaluate a
// string as JavaScript...", etc.) so rather than enumerate every verb, treat any
// CSP-related message that isn't marked report-only as enforced. Browsers prefix/suffix
// report-only violation messages with "report-only" or "[Report Only]" text
// (Chrome/Chromium use a space, not a hyphen, in the "[Report Only]" prefix).
const isEnforcedCspViolation = (msg: string) => isCspIssue(msg) && !/report[ -]only/i.test(msg);

// Console messages that are known browser/environment noise unrelated to the site under
// test. Matched by substring so new message formats stay filtered; this is report hygiene
// only, not a safety mechanism, since none of it fails the test anyway.
const KNOWN_NOISE = [
    '[astro-island]', // Astro dev-server hydration artefact, doesn't occur in production builds
    'GL Driver Message',
    'Permissions policy violation',
    'This page is in Quirks Mode',
    'favicon.ico',
    'the server responded with a status of 404',
];

function setupPageVerificationAssertions() {
    let cspViolations: string[] = [];

    test.beforeEach(({ page }, testInfo) => {
        cspViolations = [];

        const handle = (text: string, annotationPrefix: string) => {
            if (text.startsWith('*')) return; // AG Charts license text
            if (KNOWN_NOISE.some((n) => text.includes(n))) return;
            if (isEnforcedCspViolation(text)) {
                cspViolations.push(text);
                return;
            }
            const prefix = isCspIssue(text) ? '[CSP]' : annotationPrefix;
            testInfo.annotations.push({ type: 'warning', description: `${prefix} ${text}` });
        };

        page.on('console', (msg) => {
            // Chrome perf violations/interventions are emitted as 'log' type messages.
            if (msg.type() === 'log') {
                const text = msg.text();
                if (text.startsWith('[Violation]') || text.startsWith('[Intervention]')) {
                    handle(text, '[Console]');
                }
                return;
            }
            if (msg.type() !== 'warning' && msg.type() !== 'error') return;
            handle(msg.text(), '[Console]');
        });

        page.on('pageerror', (err) => {
            handle(`Uncaught exception: ${err.message}`, '[Exception]');
        });
    });

    test.afterEach(() => {
        expect(cspViolations, 'CSP violations').toEqual([]);
    });
}

function getGalleryExamples(): string[] {
    const raw = JSON.parse(readFileSync(join(__dirname, '../src/content/gallery/data.json'), 'utf-8'));
    const names: string[] = [];
    for (const group of raw.series as Array<Array<{ examples: Array<{ name: string; hidden?: boolean }> }>>) {
        for (const chartType of group) {
            for (const ex of chartType.examples ?? []) {
                // Mirror the hidden filter in filesData.ts — hidden examples have no generated page
                if (!ex.hidden) {
                    names.push(ex.name);
                }
            }
        }
    }
    return [...new Set(names)];
}

const GALLERY_EXAMPLES = getGalleryExamples();

test.use({ viewport: { width: 1400, height: 900 } });

test.describe('Page Verification', () => {
    setupPageVerificationAssertions();

    // --- Homepage ---

    test('homepage loads with title and header', async ({ page }) => {
        await gotoUrl(page, toPageUrl(''));
        await expect(page).toHaveTitle(/AG Charts/);
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    // --- Core pages ---

    test('gallery listing page loads', async ({ page }) => {
        await gotoUrl(page, toPageUrl('gallery'));
        await expect(page).toHaveTitle(/Gallery/);
        await expect(page.locator('.site-header')).toBeVisible();
    });

    test('API options page loads', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.locator('header h1')).toContainText('AgChartOptions');
    });

    test('community page loads', async ({ page }) => {
        await gotoUrl(page, toPageUrl('community'));
        await expect(page).toHaveTitle(/Community/);
        await expect(page.locator('.site-header')).toBeVisible();
    });

    test('pricing page loads with community and enterprise sections', async ({ page }) => {
        await gotoUrl(page, toPageUrl('license-pricing'));
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.locator('#community')).toBeVisible();
        await expect(page.locator('#enterprise-charts')).toBeVisible();
    });

    // --- Docs pages ---

    test('quick-start docs page loads', async ({ page }) => {
        await gotoUrl(page, toPageUrl('javascript/quick-start'));
        await expect(page).toHaveTitle(/Quick Start/);
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('bar series docs page loads', async ({ page }) => {
        await gotoUrl(page, toPageUrl('javascript/bar-series'));
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('themes docs page loads', async ({ page }) => {
        await gotoUrl(page, toPageUrl('javascript/themes'));
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    // The docs inline runner resolves its framework from a persistent store
    // (`documentation:internalFramework`, default React), not from the page URL directly — the
    // URL only syncs into that store via an effect that runs after the first render, so
    // navigating alone renders whichever framework the store defaulted to. To deterministically
    // verify both the React and the JavaScript variants render, seed the store to the target
    // framework before load, navigate to the matching docs URL, and assert the iframe's own src
    // carries that framework before checking the chart canvas.
    const inlineExampleFrameworks = [
        { framework: 'react', internalFramework: 'reactFunctional', srcSegment: /\/(reactFunctional|reactFunctionalTs)\// },
        { framework: 'javascript', internalFramework: 'vanilla', srcSegment: /\/(vanilla|typescript)\// },
    ];
    for (const { framework, internalFramework, srcSegment } of inlineExampleFrameworks) {
        test(`docs page with inline example renders a chart (${framework})`, async ({ page }) => {
            await page.addInitScript((fw) => {
                window.localStorage.setItem('documentation:internalFramework', fw);
            }, internalFramework);

            await gotoUrl(page, toPageUrl(`${framework}/quick-start`));
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            // The iframe src is set lazily by an IntersectionObserver — scroll it into
            // view to trigger the load, then wait for the chart canvas to appear.
            const iframeLocator = page.locator('iframe.exampleRunner').first();
            await iframeLocator.scrollIntoViewIfNeeded();
            // Confirm the runner resolved to the intended framework (not the store default)
            // before asserting the rendered chart, so this genuinely covers each variant.
            await expect(iframeLocator).toHaveAttribute('src', srcSegment, { timeout: 30_000 });
            const exampleFrame = iframeLocator.contentFrame();
            await expect(exampleFrame.locator(SELECTORS.canvas).first()).toBeVisible({ timeout: 30_000 });
        });
    }

    // --- Navigation ---

    test('header nav Gallery link navigates to gallery', async ({ page }) => {
        await gotoUrl(page, toPageUrl(''));
        await page.locator('.site-header').getByRole('link', { name: 'Gallery' }).first().click();
        await expect(page).toHaveURL(/gallery/);
        await expect(page.locator('.site-header')).toBeVisible();
    });

    test('header nav Community link navigates to community', async ({ page }) => {
        await gotoUrl(page, toPageUrl(''));
        await page.locator('.site-header').getByRole('link', { name: 'Community' }).first().click();
        await expect(page).toHaveURL(/community/);
        await expect(page.locator('.site-header')).toBeVisible();
    });

    // --- Product switcher ---

    test('product switcher opens and shows AG products', async ({ page }) => {
        await gotoUrl(page, toPageUrl(''));
        await page.getByRole('button', { name: 'Products' }).hover();
        await expect(page.getByRole('link', { name: /AG Grid/ }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: /AG Studio/ }).first()).toBeVisible();
    });

    // --- All gallery example pages ---

    for (const example of GALLERY_EXAMPLES) {
        test(`gallery example "${example}" loads with a chart`, async ({ page }) => {
            await gotoExample(page, toPageUrl(`gallery/examples/${example}`));
        });
    }
});
