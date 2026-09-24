import { expect, test } from './fixture';
import { setupIntrinsicAssertions, toPageUrl } from './util';

// The e2e host is treated as the website and is never watermarked, so the repro page is served from a
// host of its own and only the UMD bundles come from the dev server.
const REPRO_ORIGIN = 'http://licence-repro.example';

const REPRO_SCRIPT = `
const { AgCharts, LicenseManager } = agCharts;

const communityOnlyOptions = {
    title: { text: 'Community-only chart (no licence key)' },
    data: [
        { month: 'Jan', value: 4 },
        { month: 'Feb', value: 7 },
        { month: 'Mar', value: 3 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'value' }],
};

// Step 1: a community-only chart inside a separate document (an iframe), before any licence key is set.
const iframe = document.createElement('iframe');
iframe.style.width = '100%';
iframe.style.height = '220px';
document.getElementById('iframeHost').appendChild(iframe);

const iframeDoc = iframe.contentDocument;
iframeDoc.open();
iframeDoc.write('<div id="iframeChart" style="width:100%;height:200px"></div>');
iframeDoc.close();

AgCharts.create({
    ...communityOnlyOptions,
    container: iframeDoc.getElementById('iframeChart'),
});

// Step 2: only now set an invalid Enterprise licence key, and create a chart in the main document.
LicenseManager.setLicenseKey('invalid-license-key');

AgCharts.create({
    container: document.getElementById('myChart'),
    title: { text: 'Main-document chart, invalid Enterprise licence key' },
    data: [
        { month: 'Jan', value: 10 },
        { month: 'Feb', value: 15 },
        { month: 'Mar', value: 8 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'value' }],
});
`;

// The bundles are proxied through the repro origin: a browser on a public origin may not fetch a local
// address itself, so Playwright fetches them from the dev server instead.
const BUNDLES: Record<string, string> = {
    '/ag-charts-community.js': toPageUrl('dev/ag-charts-community/dist/umd/ag-charts-community.js'),
    '/ag-charts-enterprise.js': toPageUrl('dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js'),
};

function reproPage() {
    return `<!doctype html>
<html lang="en">
    <head><meta charset="UTF-8" /><title>Licence watermark repro</title></head>
    <body>
        <div id="iframeHost"></div>
        <div id="myChart" style="width: 600px; height: 400px"></div>
        <script src="/ag-charts-community.js"></script>
        <script src="/ag-charts-enterprise.js"></script>
        <script>${REPRO_SCRIPT}</script>
    </body>
</html>`;
}

test.describe('licence watermark', () => {
    setupIntrinsicAssertions(test);

    // A chart created in a second document must not stop a later chart in the main document from being watermarked.
    test('watermarks a main-document chart after a community-only chart was created in an iframe', async ({ page }) => {
        await page.route(`${REPRO_ORIGIN}/**`, async (route) => {
            const bundle = BUNDLES[new URL(route.request().url()).pathname];
            if (bundle == null) {
                return route.fulfill({ contentType: 'text/html', body: reproPage() });
            }
            const response = await page.request.get(bundle);
            return route.fulfill({ contentType: 'text/javascript', body: await response.body() });
        });
        await page.goto(`${REPRO_ORIGIN}/`);

        const watermark = page.locator('#myChart .ag-watermark');
        await expect(watermark).toBeVisible();
        await expect(watermark).toContainText('Invalid License');

        // The banner is only a watermark once the enterprise stylesheet reaches the main document.
        const style = await watermark.evaluate((el) => {
            const own = getComputedStyle(el);
            const logo = getComputedStyle(el, '::before');
            return { position: own.position, fontFamily: own.fontFamily, logo: logo.backgroundImage };
        });
        expect(style.position).toBe('absolute');
        expect(style.fontFamily).toContain('Impact');
        expect(style.logo).toContain('data:image/svg+xml');
    });
});
