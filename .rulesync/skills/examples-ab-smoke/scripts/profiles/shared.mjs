// Shared helpers used by all product profiles.
//
// Profile contract — each profile module exports:
//
//   PRODUCT          string    e.g. 'ag-charts'
//   PRODUCT_SHORT    string    e.g. 'charts'
//   FRAMEWORKS       string[]  supported frameworks
//   SELECTORS        object    DOM selectors (shape varies by product)
//   NOISE_RE         RegExp    console-noise filter pattern
//   EXAMPLE_OPTIONS  object    per-page example overrides (mirror of upstream e2e config)
//   IGNORE_PAGES     string[]  pages to skip entirely
//   PHASE_ORDER      string[]  ordered phase names for display
//   META_ENDPOINT    string    path to the debug metadata JSON on the deployed site
//
//   isNoise(text, location)                → boolean
//   buildExampleUrl(baseUrl, entry)        → string
//   resolveOptions(page, example)          → merged options object
//   isUnsupportedGeneric(page, example)    → boolean
//
//   waitForReady(page, timeoutMs)          → { settled: boolean, reason? }
//   waitForContent(page, timeoutMs)        → boolean (content element is present and non-zero)
//   takeScreenshot(page, outPath)          → boolean
//   shouldSkipPhases(page, result)         → { skip: boolean, reason? }
//
//   DISCOVERY.contentGlob                  glob pattern relative to content dir
//   DISCOVERY.getContentDir(repoRoot)      → absolute path to content dir
//   DISCOVERY.repoFingerprint              dir name to probe during repo-root detection
//   DISCOVERY.driftCheckSources            rel paths to upstream e2e configs for drift check
//   DISCOVERY.galleryPage                  string|null — page name that uses gallery URL scheme
//   DISCOVERY.galleryFrameworks            string[]|null — frameworks allowed on gallery page
//
//   PHASES[]  array of { name, run(ctx), guard?(ctx) }
//     Phase runner ctx shape:
//       page          Playwright Page
//       entry         matrix entry { page, example, framework, options, ... }
//       side          { name, baseUrl }
//       sideKey       'left' | 'right'
//       result        the per-side result object being built
//       profile       the loaded profile module
//       screenshotDir path to screenshot output dir for this side
//       helpers       { newPhase, pushException, snapshotErrorCounts, pushErrorExceptionsSince,
//                       sleep, slug, settleForScreenshot, dismissCookieBanner }
//       state         {} — mutable bag for cross-phase state (e.g. canvasBox)
//
//     Phase runner returns the completed phase object (from newPhase).
//     On return, the page should be in a neutral state (mouse at 10,10, no popovers).
//     guard(ctx) is called before run; if it returns false, the phase is skipped.

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function slug(s) {
    return (s ?? 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32);
}

export function newPhase(name) {
    return { name, screenshots: [], exceptions: [], notes: [], data: {} };
}

export function pushException(phase, type, evidence) {
    phase.exceptions.push({ type, ...evidence });
}

export function snapshotErrorCounts(result) {
    return { console: result.consoleErrors.length, page: result.pageErrors.length };
}

export function pushErrorExceptionsSince(phase, result, before) {
    if (result.consoleErrors.length > before.console) {
        pushException(phase, 'console-error', {
            newConsoleErrors: result.consoleErrors.slice(before.console),
            newCount: result.consoleErrors.length - before.console,
        });
    }
    if (result.pageErrors.length > before.page) {
        pushException(phase, 'page-error', {
            newPageErrors: result.pageErrors.slice(before.page),
            newCount: result.pageErrors.length - before.page,
        });
    }
}

export async function dismissCookieBanner(page) {
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
        const dismissed = await page
            .evaluate(() => {
                const candidates = [
                    '#onetrust-reject-all-handler',
                    '.ot-pc-refuse-all-handler',
                    '#onetrust-accept-btn-handler',
                    '.onetrust-close-btn-handler',
                ];
                for (const sel of candidates) {
                    const el = document.querySelector(sel);
                    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                        el.click();
                        return sel;
                    }
                }
                return null;
            })
            .catch(() => null);
        if (dismissed) {
            await sleep(400);
            return dismissed;
        }
        await sleep(200);
    }
    return null;
}

export async function takeElementScreenshot(page, selector, outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    const el = page.locator(selector).first();
    try {
        await el.screenshot({ path: outPath, timeout: 15000 });
        return true;
    } catch {
        await page.screenshot({ path: outPath, fullPage: false }).catch(() => null);
        return false;
    }
}
