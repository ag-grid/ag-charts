import { expect, test } from '@playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';

import { DEMO_APPS } from '../src/registry';

const registeredIds = new Set(DEMO_APPS.map((app) => app.id));

test('every demo folder is registered in DEMO_APPS', () => {
    const folders = readdirSync(join(process.cwd(), 'src', 'demos'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

    const unregistered = folders.filter((folder) => !registeredIds.has(folder));
    expect(unregistered, 'demo folders with no matching DEMO_APPS entry').toEqual([]);
});

for (const app of DEMO_APPS) {
    test(`demo "${app.id}" renders without console errors`, async ({ page }) => {
        const consoleIssues: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() !== 'error' && msg.type() !== 'warning') return;
            // AG Charts licence message is logged with a leading '*'.
            if (msg.text().startsWith('*')) return;
            consoleIssues.push(msg.text());
        });
        page.on('pageerror', (err) => consoleIssues.push(err.message));

        await page.goto(`/#${app.id}`);

        // Assert the selected demo resolved, not App's unknown-id fallback.
        await expect(page.locator(`[data-demo-id="${app.id}"]`)).toBeVisible();
        await expect(page.locator('.ag-charts-wrapper').first()).toBeVisible();
        await expect(page.locator('canvas').first()).toBeVisible();
        expect(consoleIssues).toEqual([]);
    });
}
