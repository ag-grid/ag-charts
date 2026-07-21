import type { Locator, Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';

// Import the sampler from its source module directly, not via the `_ag-charts-test` package entry.
// The barrel eagerly loads skia-canvas (a native addon) through mock-canvas, and the package's built
// `dist` is not present in the Playwright CI container; the source module (transpiled by Playwright)
// depends only on ag-charts-core, so both problems are avoided while keeping a single shared source.
import {
    type SerializedSceneRoots,
    sampleSerializedRoots,
    sceneSampleToJSON,
} from '../../../libraries/ag-charts-test/src/scene/scene-sample';
import { expect, test } from './fixture';
import { waitForAllChartUpdates } from './util';

type SceneCaptureMode = 'all' | 'off' | 'diff';

function sceneCaptureMode(): SceneCaptureMode {
    const mode = process.env.AG_SCENE_SNAPSHOTS;
    return mode === 'all' || mode === 'off' ? mode : 'diff';
}

function writeSceneSnapshots(name: string, roots: SerializedSceneRoots[]): void {
    if (roots.length === 0) return;
    // Mirror Playwright's resolved screenshot path so the scene JSON carries the same project and
    // platform identity as its screenshot (e.g. `chart-chromium-linux`) and cannot collide when the
    // same test runs under multiple projects.
    const screenshot = parse(test.info().snapshotPath(name, { kind: 'screenshot' }));
    const dir = join(screenshot.dir, '__scene_snapshots__');
    mkdirSync(dir, { recursive: true });
    for (const [i, root] of roots.entries()) {
        const id = roots.length > 1 ? `${screenshot.name}-chart${i}` : screenshot.name;
        const json = sceneSampleToJSON(sampleSerializedRoots(root, { includeChrome: true }));
        writeFileSync(join(dir, `${id}.json`), JSON.stringify(json, null, 2));
    }
}

/**
 * Screenshot a chart target and, unless `AG_SCENE_SNAPSHOTS=off`, capture an adjacent scene-graph JSON
 * beside the image baseline (`<spec>.ts-snapshots/__scene_snapshots__/<name>.json`) in the identical
 * shape as the unit capture, for mechanical (coordinate-level) diff review. One JSON per chart on the
 * page, suffixed `-chart<i>` when more than one.
 *
 * Playwright exposes no per-assertion image-diff result (unlike jest-image-snapshot), so `all` and
 * `diff` behave identically here — capture whenever the flag is not `off`. CI sets `all` on baseline
 * pushes and `diff` on PRs; both capture.
 */
export async function expectChartScreenshot(
    page: Page,
    target: Page | Locator,
    name: string,
    options?: Parameters<ReturnType<typeof expect<Locator>>['toHaveScreenshot']>[1]
): Promise<void> {
    await waitForAllChartUpdates(page);
    if (sceneCaptureMode() === 'off') {
        await expect(target).toHaveScreenshot(name, options);
        return;
    }
    // Capture whatever the screenshot outcome — the JSON explains a pixel change and must be written
    // even on an image diff, mirroring the unit compareImageSnapshot.
    let screenshotError: unknown;
    let screenshotFailed = false;
    try {
        await expect(target).toHaveScreenshot(name, options);
    } catch (error) {
        screenshotFailed = true;
        screenshotError = error;
    }

    try {
        const roots = await page.evaluate(
            () =>
                (
                    window as unknown as { agE2E?: { captureScenes?: () => SerializedSceneRoots[] } }
                ).agE2E?.captureScenes?.() ?? []
        );
        writeSceneSnapshots(name, roots);
    } catch (captureError) {
        // A missing scene artifact must not hide behind a passing screenshot, so fail the test on a
        // capture error. When the screenshot also failed, that is the more actionable error — keep it.
        if (!screenshotFailed) {
            throw captureError;
        }
        process.stderr.write(`AG_SCENE_SNAPSHOTS: e2e scene capture failed: ${String(captureError)}\n`);
    }

    if (screenshotFailed) {
        throw screenshotError;
    }
}
