import { describe, expect, test } from 'vitest';

import { buildAgentsMd, buildLlmsTxt } from './agentReadinessFiles';

const INPUT = {
    siteRoot: 'https://www.ag-grid.com/charts/',
    majorVersion: 12,
    chartsDocsPrefix: 'javascript',
};

describe('buildLlmsTxt', () => {
    const txt = buildLlmsTxt(INPUT);

    test('leads with the AG Charts heading and current major version', () => {
        expect(txt).toContain('# AG Charts');
        expect(txt).toContain('v12');
    });

    test('links the key charts pages from the canonical base', () => {
        expect(txt).toContain('(https://www.ag-grid.com/charts/javascript/quick-start/)');
        expect(txt).toContain('(https://www.ag-grid.com/charts/license-pricing/)');
        expect(txt).toContain('(https://www.ag-grid.com/charts/community/)');
        expect(txt).toContain('(https://www.ag-grid.com/charts/documentation-archive/)');
        expect(txt).toContain('(https://www.ag-grid.com/charts/sitemap-index.xml)');
    });

    test('advertises the markdown (.md) convention as a site-wide rule, not a page list', () => {
        expect(txt).toContain('.md');
        expect(txt).toContain('https://www.ag-grid.com/charts/javascript/quick-start.md');
        // Nearly every page in the sitemap has a twin, so llms.txt states the rule. Enumerating
        // pages here would drift the moment one is added (see markdownPages.test.ts).
        expect(txt).toContain('append `.md` to any page URL listed in the sitemap');
        expect(txt).toContain('Accept: text/markdown');
    });

    test('names the API reference pages as the one gap, so an agent does not chase 404s', () => {
        expect(txt).toContain('Options and Themes API reference pages are the exception');
    });

    test('omits the markdown convention when markdown docs are disabled', () => {
        const disabled = buildLlmsTxt({ ...INPUT, includeMarkdownDocs: false });
        expect(disabled).not.toContain('.md');
    });

    test('derives every link from the canonical base (no other host)', () => {
        const urls = txt.match(/\(https?:\/\/[^)]+\)/g) ?? [];
        expect(urls.length).toBeGreaterThan(0);
        for (const url of urls) {
            expect(url).toContain('https://www.ag-grid.com/charts/');
        }
    });
});

describe('buildAgentsMd', () => {
    const md = buildAgentsMd(INPUT);

    test('is a guide for AI coding assistants with install instructions', () => {
        expect(md).toContain('guide for AI coding assistants');
        expect(md).toContain('ag-charts-community');
        expect(md).toContain('https://www.ag-grid.com/charts/llms.txt');
    });

    test('advertises the markdown (.md) versions as a site-wide rule', () => {
        expect(md).toContain('Markdown for LLMs');
        expect(md).toContain('https://www.ag-grid.com/charts/javascript/quick-start.md');
        // Nearly every page in the sitemap has a twin, so point at the sitemap rather than
        // listing pages that would drift (see markdownPages.test.ts for the guarantee).
        expect(md).toContain('append `.md` to any page URL listed in the');
        expect(md).toContain('[sitemap](https://www.ag-grid.com/charts/sitemap-index.xml)');
        expect(md).toContain('Options and Themes API reference pages are the exception');
    });

    test('omits the markdown affordance when markdown docs are disabled', () => {
        const disabled = buildAgentsMd({ ...INPUT, includeMarkdownDocs: false });
        expect(disabled).not.toContain('.md');
        expect(disabled).not.toContain('Markdown for LLMs');
    });
});
