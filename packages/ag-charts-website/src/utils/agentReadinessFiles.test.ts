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
        // Every page in the sitemap has a twin, so llms.txt states the rule. Enumerating pages
        // here would drift the moment one is added (see markdownPages.test.ts).
        expect(txt).toContain('append `.md` to any page URL listed in the sitemap');
        expect(txt).toContain('Accept: text/markdown');
    });

    test('claims no exceptions to the rule, so an agent does not skip a page that has a twin', () => {
        expect(txt).not.toContain('exception');
    });

    test('points at index.md for the homepage, whose twin is not a `.md` suffix', () => {
        expect(txt).toContain('https://www.ag-grid.com/charts/index.md');
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

    describe('page index', () => {
        const DOCS_INDEX = [
            {
                title: 'Series > Cartesian',
                links: [
                    { title: 'Bar Series', url: 'https://www.ag-grid.com/charts/javascript/bar-series/' },
                    { title: 'Line Series', url: 'https://www.ag-grid.com/charts/javascript/line-series/' },
                ],
            },
        ];
        const SITE_INDEX = [
            { title: 'General', links: [{ title: 'Gallery', url: 'https://www.ag-grid.com/charts/gallery/' }] },
        ];
        const indexed = buildLlmsTxt({ ...INPUT, docsIndex: DOCS_INDEX, siteIndex: SITE_INDEX });

        test('publishes the docs under their navigation groups, in the order given', () => {
            expect(indexed).toContain('## Documentation');
            expect(indexed).toContain(
                [
                    '### Series > Cartesian',
                    '- [Bar Series](https://www.ag-grid.com/charts/javascript/bar-series/)',
                    '- [Line Series](https://www.ag-grid.com/charts/javascript/line-series/)',
                ].join('\n')
            );
        });

        test('states the framework substitution instead of repeating the docs four times', () => {
            expect(indexed).toContain('replace `javascript` with `<framework>`');
            expect(indexed).not.toContain('react/bar-series');
        });

        test('publishes the rest of the site under its sitemap groups', () => {
            expect(indexed).toContain('## Site pages');
            expect(indexed).toContain('### General\n- [Gallery](https://www.ag-grid.com/charts/gallery/)');
        });

        test('keeps the curated sections above the index', () => {
            expect(indexed.indexOf('## Docs and tools')).toBeLessThan(indexed.indexOf('## Documentation'));
            expect(indexed.indexOf('## Optional')).toBeLessThan(indexed.indexOf('## Documentation'));
            expect(indexed.indexOf('## Documentation')).toBeLessThan(indexed.indexOf('## Site pages'));
        });

        test('emits no index headings when there is nothing to index', () => {
            expect(txt).not.toContain('## Documentation');
            expect(txt).not.toContain('## Site pages');
            expect(buildLlmsTxt({ ...INPUT, docsIndex: [], siteIndex: [] })).toBe(txt);
        });
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
        // Every page in the sitemap has a twin, so point at the sitemap rather than listing
        // pages that would drift (see markdownPages.test.ts for the guarantee).
        expect(md).toContain('append `.md` to any page URL listed in the');
        expect(md).toContain('[sitemap](https://www.ag-grid.com/charts/sitemap-index.xml)');
        expect(md).not.toContain('exception');
    });

    test('points at index.md for the homepage, whose twin is not a `.md` suffix', () => {
        expect(md).toContain('https://www.ag-grid.com/charts/index.md');
    });

    test('omits the markdown affordance when markdown docs are disabled', () => {
        const disabled = buildAgentsMd({ ...INPUT, includeMarkdownDocs: false });
        expect(disabled).not.toContain('.md');
        expect(disabled).not.toContain('Markdown for LLMs');
    });
});
