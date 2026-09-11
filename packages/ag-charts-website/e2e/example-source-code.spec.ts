import { expect, test } from './fixture';
import { gotoUrl, toPageUrl } from './util';

// Docs pages embed a hidden, build-time copy of each example's source so crawlers can index it.
// The example runner island then removes that copy and shows the same files behind its Code button.
// Both halves matter: the raw HTML has to carry the code, and the page a user sees must not carry
// it twice or show anything a crawler could not.

// The HTML embeds the TypeScript variant, matching the markdown twin page. A first visit shows the
// JavaScript variant in the code viewer (the docs default), so the two main files differ.
const PAGES = [
    {
        path: 'react/quick-start/',
        exampleName: 'basic-example',
        embeddedMainFile: 'index.tsx',
        viewerMainFile: 'index.jsx',
    },
    {
        path: 'javascript/quick-start/',
        exampleName: 'basic-example',
        embeddedMainFile: 'main.ts',
        viewerMainFile: 'main.js',
    },
];

test.describe('Example source embedded for crawlers', () => {
    for (const { path, exampleName, embeddedMainFile, viewerMainFile } of PAGES) {
        test(`${path} serves the ${exampleName} source in its HTML`, async ({ request }) => {
            const response = await request.get(toPageUrl(path));
            expect(response.ok()).toBe(true);
            const html = await response.text();

            const panel = html.match(
                new RegExp(
                    `<div id="example-${exampleName}"[\\s\\S]*?<div class="example-runner-source-code"[^>]*>([\\s\\S]*?)</div>`
                )
            );
            expect(panel, 'hidden source panel inside the example container').not.toBeNull();

            const panelHtml = panel![0];
            expect(panelHtml).toContain(' hidden');
            expect(panelHtml).toContain(`<figcaption>${embeddedMainFile}</figcaption>`);
            expect(panelHtml).toContain(`<code data-file-name="${embeddedMainFile}">`);
            // The quick start example charts ice cream sales, whichever framework renders it
            expect(panelHtml).toContain('iceCreamSales');
            // The generator's harness is not part of what the Code button shows
            expect(panelHtml).not.toContain('DARK MODE');
        });

        test(`${path} shows the same ${exampleName} source behind the Code button`, async ({ page }) => {
            await gotoUrl(page, toPageUrl(path));

            const container = page.locator(`#example-${exampleName}`);
            // The runner hydrates when scrolled into view, and only then owns the code viewer
            await container.scrollIntoViewIfNeeded();
            // `exact`, so the CodeSandbox button in the same footer cannot match
            const codeButton = container.getByRole('button', { name: 'Code', exact: true });
            await expect(codeButton).toBeVisible();
            // The island owns the code viewer once mounted, so the build-time copy is gone
            await expect(container.locator('[data-example-source-code]')).toHaveCount(0);

            await codeButton.click();
            await expect(container.getByRole('button', { name: viewerMainFile })).toBeVisible();
            await expect(container.locator('pre.code')).toContainText('iceCreamSales');
        });
    }
});
