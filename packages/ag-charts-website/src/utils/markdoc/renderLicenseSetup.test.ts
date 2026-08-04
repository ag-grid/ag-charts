import type { MarkdownFramework } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import { describe, expect, it } from 'vitest';

import { buildLicenseSetupMarkdown } from './renderLicenseSetup';

const SITE_ROOT = 'https://www.ag-grid.com/';

function build(framework: MarkdownFramework = 'javascript'): string {
    return buildLicenseSetupMarkdown({ framework, siteRoot: SITE_ROOT });
}

/** Fenced blocks in document order, as `[language, code]`. */
function fences(output: string): [string, string][] {
    return [...output.matchAll(/^(`{3,})(\S*)\n([\s\S]*?)^\1$/gm)].map(([, , language, code]) => [
        language,
        code.trimEnd(),
    ]);
}

describe('buildLicenseSetupMarkdown', () => {
    it('renders the tool headings in page order and at the page depths', () => {
        const headings = build()
            .split('\n')
            .filter((line) => line.startsWith('#'));

        expect(headings).toEqual([
            '## Validate Your Licence',
            '### Add Your Dependencies',
            '### Set Up Your Application',
        ]);
    });

    it('links validation back to the interactive tool on the page', () => {
        expect(build('react')).toContain(
            '[Validate your licence key](https://www.ag-grid.com/react/license-install/) using the tool on this page.'
        );
    });

    it('keeps the prose that introduces each snippet', () => {
        const output = build();

        expect(output).toContain('Copy the following dependencies into your `package.json`:');
        expect(output).toContain('Or install using npm:');
        expect(output).toContain('An example of how to set up your AG Charts Enterprise License Key:');
    });

    it('renders the older-version note as a callout linking to the archive', () => {
        expect(build()).toContain(
            [
                '> **Note**',
                '>',
                '> If you are using an older version of AG Charts, before v11.0.0, please see the relevant' +
                    ' [documentation](https://www.ag-grid.com/documentation-archive) for help on installing your license key',
            ].join('\n')
        );
    });

    it('emits the dependencies, npm install and bootstrap snippets in page order', () => {
        const [dependencies, npmInstall, bootstrap] = fences(build('react'));

        expect(dependencies[1]).toContain('dependencies: {');
        expect(npmInstall).toEqual(['bash', 'npm install ag-charts-enterprise ag-charts-react']);
        expect(bootstrap[1]).toContain('LicenseManager.setLicenseKey("your License Key");');
    });

    it.each([
        ['react', 'jsx', 'ag-charts-react'],
        ['angular', 'ts', 'ag-charts-angular'],
        ['vue', 'ts', 'ag-charts-vue3'],
    ] as const)('resolves the %s packages and fence language', (framework, language, wrapperPackage) => {
        const [dependencies, npmInstall, bootstrap] = fences(build(framework));

        expect(dependencies[0]).toBe(language);
        expect(dependencies[1]).toContain(`"${wrapperPackage}"`);
        expect(npmInstall[1]).toBe(`npm install ag-charts-enterprise ${wrapperPackage}`);
        expect(bootstrap[0]).toBe(language);
        expect(bootstrap[1]).toContain(`import { AgCharts } from "${wrapperPackage}";`);
    });

    // The JavaScript page installs no framework wrapper, and bootstraps from community.
    it('resolves the javascript packages', () => {
        const [dependencies, npmInstall, bootstrap] = fences(build('javascript'));

        expect(dependencies[0]).toBe('js');
        expect(dependencies[1]).not.toContain('ag-charts-react');
        expect(npmInstall[1]).toBe('npm install ag-charts-enterprise');
        expect(bootstrap[1]).toContain('import { AgCharts } from "ag-charts-community";');
    });
});
