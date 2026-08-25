import { EXAMPLE_RUNNER_SCRIPT_FILE_NAME } from '@ag-website-shared/components/example-runner/components/ExampleRunnerClient';
import type { ExampleFramework } from '@utils/example-modules/getImportMap';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';

const FRAMEWORKS: ExampleFramework[] = ['typescript', 'react', 'angular', 'vue3'];

const SITE_URL = 'https://site.example';
const BASE_URL = '/base/';

const renderMarkup = async ({
    framework,
    transpileInBrowser,
}: {
    framework: ExampleFramework;
    transpileInBrowser?: boolean;
}) => {
    vi.stubEnv('PUBLIC_BASE_URL', BASE_URL);
    vi.stubEnv('PUBLIC_SITE_URL', SITE_URL);
    vi.resetModules();

    const { ExampleModules } = await import('./ExampleModules');

    return renderToStaticMarkup(
        <ExampleModules
            appLocation="/examples/bar-series/basic-bar/typescript/"
            entryFileName="main.ts"
            framework={framework}
            transpileInBrowser={transpileInBrowser}
        />
    );
};

describe('ExampleModules', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    describe.each(FRAMEWORKS)('%s', (framework) => {
        test('loads the runtime once, before the example is loaded', async () => {
            const html = await renderMarkup({ framework });

            const client = html.indexOf(EXAMPLE_RUNNER_SCRIPT_FILE_NAME);
            const entryModule = html.indexOf('type="module"');

            expect(html.match(new RegExp(EXAMPLE_RUNNER_SCRIPT_FILE_NAME, 'g'))).toHaveLength(1);
            expect(client).toBeGreaterThan(-1);
            expect(client).toBeLessThan(entryModule);
        });

        test('sets the page up through the runtime, leaving only the call in the page', async () => {
            const html = await renderMarkup({ framework });

            expect(html).toContain('agExampleRunner.setUpPage();');
            expect(html).not.toContain('window.process =');
        });

        test('serves the runtime from the site in the runner, so that fixes reach every page', async () => {
            const html = await renderMarkup({ framework });

            expect(html).toContain(`src="${SITE_URL}${BASE_URL}example-runner/${EXAMPLE_RUNNER_SCRIPT_FILE_NAME}"`);
        });

        test('loads the runtime from the exported project, so that a saved export keeps working', async () => {
            const html = await renderMarkup({ framework, transpileInBrowser: true });

            expect(html).toContain(`src="./${EXAMPLE_RUNNER_SCRIPT_FILE_NAME}"`);
            expect(html).not.toContain(`example-runner/${EXAMPLE_RUNNER_SCRIPT_FILE_NAME}`);
        });

        test('runs the entry module directly when the sources are served transpiled', async () => {
            const html = await renderMarkup({ framework });

            expect(html).toContain('src="/examples/bar-series/basic-bar/typescript/main.js"');
            expect(html).not.toContain('agExampleRunner.runTranspiled(');
        });

        test('transpiles in the page for an export, which has no build step', async () => {
            const html = await renderMarkup({ framework, transpileInBrowser: true });

            expect(html).toContain('agExampleRunner.runTranspiled(');
            expect(html).not.toContain('main.js');
        });

        test('emits the same import map for an export as for the runner', async () => {
            const importMap = async (transpileInBrowser?: boolean) => {
                const html = await renderMarkup({ framework, transpileInBrowser });
                const map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);

                return JSON.parse(map![1].replaceAll('&quot;', '"')).imports;
            };

            expect(await importMap(true)).toEqual(await importMap());
        });
    });
});
