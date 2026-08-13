import type { Page, TestInfo } from '@playwright/test';
import { readFileSync } from 'fs';
import { createHash } from 'node:crypto';
import { join } from 'path';

import type { CspHashHint, CspViolationRecord } from '../src/utils/csp/cspViolationReport';
import {
    CSP_HASH_HINT_ANNOTATION,
    CSP_VIOLATION_ANNOTATION,
    parseCspHashHint,
} from '../src/utils/csp/cspViolationReport';
import { expect, test } from './fixture';
import { gotoExample, gotoUrl, toExamplePageUrl, toPageUrl } from './util';

declare global {
    interface Window {
        __agCspSelfCheck?: boolean;
    }
}

/** Inline script the site policy cannot authorise, used to prove CSP capture still works. */
const CSP_SELF_CHECK_SCRIPT = 'window.__agCspSelfCheck = true;';

// This is a smoke test suite: a page failing to load or render (checked via the assertions
// in each test, plus gotoUrl/gotoExample's own title/canvas checks) is the only way a test
// fails here. Everything else the page reports (console errors/warnings, uncaught exceptions,
// dev-server hydration noise, CSP violations) is recorded as a test annotation for visibility
// without failing the test. CSP is annotated rather than asserted because the policy
// authorises inline scripts injected by tags authored in Google Tag Manager, outside this
// repo: editing a tag there invalidates its hash, which must not turn every page in the suite
// red. The post-deploy workflow reports those annotations to the team that owns the policy
// instead. This intentionally doesn't use the shared setupIntrinsicAssertions from util.ts —
// that helper's zero-tolerance behaviour is right for the feature-level e2e specs that use it,
// but wrong for a post-deploy smoke test.
// Chromium writes the policy name with spaces in some messages and hyphens in others.
const isCspIssue = (msg: string) => /Content[- ]Security[- ]Policy|Refused to (load|execute|connect)/i.test(msg);

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
    test.beforeEach(async ({ page }, testInfo) => {
        const handle = (text: string, annotationPrefix: string, sourceUrl: string) => {
            if (text.startsWith('*')) return; // AG Charts license text
            if (KNOWN_NOISE.some((n) => text.includes(n))) return;
            if (isCspIssue(text)) {
                // What the console adds over the violation event is the hash the browser
                // suggests for a blocked inline script, which the event doesn't carry.
                const hint = parseCspHashHint(text, sourceUrl);
                if (hint) {
                    testInfo.annotations.push({
                        type: CSP_HASH_HINT_ANNOTATION,
                        description: JSON.stringify(hint),
                    });
                    return;
                }
                // Otherwise keep it visible in the report: the violation listener is installed
                // on documents, so a worker's CSP failure reaches the console and nothing else.
                testInfo.annotations.push({ type: 'warning', description: `[CSP] ${text}` });
                return;
            }
            testInfo.annotations.push({ type: 'warning', description: `${annotationPrefix} ${text}` });
        };

        page.on('console', (msg) => {
            // Chrome perf violations/interventions are emitted as 'log' type messages.
            if (msg.type() === 'log') {
                const text = msg.text();
                if (text.startsWith('[Violation]') || text.startsWith('[Intervention]')) {
                    handle(text, '[Console]', msg.location()?.url || page.url());
                }
                return;
            }
            if (msg.type() !== 'warning' && msg.type() !== 'error') return;
            // The message's own location, not page.url(): a violation inside an iframe is
            // reported against that frame's document, and a hash has to be matched to the
            // page that needs it.
            handle(msg.text(), '[Console]', msg.location()?.url || page.url());
        });

        page.on('pageerror', (err) => {
            handle(`Uncaught exception: ${err.message}`, '[Exception]', page.url());
        });

        await watchCspViolations(page, testInfo);
    });
}

const REPORT_CSP_VIOLATION_BINDING = '__agReportCspViolation';

// The browser's own violation event, rather than the console text: it reports the effective
// directive, what was blocked and whether the policy enforced or merely reported it, and it
// catches violations that never reach the console at all (a blocked eval surfaces as an
// exception the calling script can swallow).
async function watchCspViolations(page: Page, testInfo: TestInfo): Promise<void> {
    await page.exposeBinding(REPORT_CSP_VIOLATION_BINDING, (_source, violation: CspViolationRecord) => {
        testInfo.annotations.push({ type: CSP_VIOLATION_ANNOTATION, description: JSON.stringify(violation) });
    });
    await page.addInitScript((binding) => {
        document.addEventListener('securitypolicyviolation', (event) => {
            const report = (window as unknown as Record<string, (violation: CspViolationRecord) => void>)[binding];
            report({
                directive: event.effectiveDirective || event.violatedDirective,
                blockedUri: event.blockedURI,
                disposition: event.disposition,
                sourceFile: event.sourceFile,
                pageUrl: document.location.href,
            });
        });
    }, REPORT_CSP_VIOLATION_BINDING);
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

    // Sense-check the standalone example runner across frameworks by loading a couple of
    // examples directly at their framework-specific URLs and asserting a chart renders. This
    // exercises each framework's example compiler head-on — in particular the vanilla
    // (JavaScript) build. The docs-page inline runner defaults to the TypeScript variant, so it
    // can render while the vanilla compiler is broken; loading the `vanilla` URL directly is what
    // actually catches that. gotoExample waits for the chart canvas and its render-stable state.
    const exampleRenderChecks = [
        { pageSlug: 'quick-start', example: 'basic-example' },
        { pageSlug: 'bar-series', example: 'simple-bar' },
    ];
    for (const { pageSlug, example } of exampleRenderChecks) {
        for (const framework of ['reactFunctional', 'vanilla'] as const) {
            test(`example runner renders a chart: ${pageSlug}/${example} (${framework})`, async ({ page }) => {
                await gotoExample(page, toExamplePageUrl(pageSlug, example, framework).url);
            });
        }
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

    // --- CSP capture ---

    // Since no test fails on a CSP violation any more, a break in the capture path would
    // otherwise be invisible: the suite would stay green while quietly reporting nothing.
    // Serving an inline script the policy cannot authorise proves the whole path still works.
    test('captures a blocked inline script with the hash needed to authorise it', async ({ page }, testInfo) => {
        // Route the URL the run actually resolved, so this holds for a build deployed under a
        // path prefix as well as at a domain root.
        await gotoUrl(page, toPageUrl(''));
        const annotations = testInfo.annotations;
        const beforeInjection = annotations.length;

        await page.route(page.url(), async (route) => {
            const response = await route.fetch();
            const body = (await response.text()).replace('</head>', `<script>${CSP_SELF_CHECK_SCRIPT}</script></head>`);
            await route.fulfill({ response, body });
        });
        await page.reload();

        // Only what the injected reload provoked is this test's own doing: anything the first
        // navigation reported is a real violation and stays in the report. Removing it before
        // the assertions means a failure here cannot leak the synthetic violation either.
        const synthetic = annotations
            .slice(beforeInjection)
            .filter(
                (annotation) =>
                    annotation.type === CSP_VIOLATION_ANNOTATION || annotation.type === CSP_HASH_HINT_ANNOTATION
            );
        annotations.splice(
            0,
            annotations.length,
            ...annotations.filter((annotation) => !synthetic.includes(annotation))
        );

        expect(await page.evaluate(() => window.__agCspSelfCheck === true), 'injected script ran').toBe(false);

        const violations = synthetic
            .filter((annotation) => annotation.type === CSP_VIOLATION_ANNOTATION)
            .map((annotation) => JSON.parse(annotation.description ?? '{}') as CspViolationRecord);
        expect(violations, 'the injected script reported as blocked').toContainEqual(
            expect.objectContaining({
                blockedUri: 'inline',
                disposition: 'enforce',
                directive: expect.stringContaining('script-src'),
            })
        );

        const hashes = synthetic
            .filter((annotation) => annotation.type === CSP_HASH_HINT_ANNOTATION)
            .map((annotation) => (JSON.parse(annotation.description ?? '{}') as CspHashHint).hash);
        expect(hashes, 'the hash that would authorise the injected script').toContain(
            `sha256-${createHash('sha256').update(CSP_SELF_CHECK_SCRIPT, 'utf8').digest('base64')}`
        );
    });

    // --- All gallery example pages ---

    for (const example of GALLERY_EXAMPLES) {
        test(`gallery example "${example}" loads with a chart`, async ({ page }) => {
            await gotoExample(page, toPageUrl(`gallery/examples/${example}`));
        });
    }
});
