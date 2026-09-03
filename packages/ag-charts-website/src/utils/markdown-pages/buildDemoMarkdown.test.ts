import { DEMO_PAGE_CONTENT, DEMO_PAGE_HERO } from '@components/demo-examples/demoPageContent';
import { DEMO_EXAMPLES } from '@components/demo-examples/exampleRegistry';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { describe, expect, it } from 'vitest';

import { buildDemoMarkdown } from './buildDemoMarkdown';

const SITE_ROOT = 'https://www.ag-grid.com/';

const DEMOS = DEMO_EXAMPLES.map((example) => example.id);

describe('buildDemoMarkdown', () => {
    it('covers every demo the page registry lists', () => {
        for (const demo of DEMOS) {
            expect(DEMO_PAGE_CONTENT[demo]).toBeDefined();
        }
    });

    describe.each(DEMOS)('%s', (demo) => {
        const output = buildDemoMarkdown({ demo, siteRoot: SITE_ROOT });

        it('emits frontmatter matching the page meta, then the shared hero copy', () => {
            expect(output).toContain(`title: ${JSON.stringify(DEMO_PAGE_CONTENT[demo].metaTitle)}`);
            expect(output).toContain(`description: ${JSON.stringify(DEMO_PAGE_CONTENT[demo].metaDescription)}`);
            expect(output).toContain(`# ${DEMO_PAGE_HERO.title}`);
            expect(output).toContain(DEMO_PAGE_HERO.description);
        });

        it('says the demo is interactive and only exists in a browser', () => {
            expect(output).toContain('runs an interactive AG Charts demo');
            expect(output).toContain('It has no text version');
        });

        it('lists every sibling demo with its description, on an absolute trailing-slash URL', () => {
            for (const example of DEMO_EXAMPLES) {
                const url = urlWithBaseUrl(example.path);
                expect(output).toContain(`- [${example.title}](https://www.ag-grid.com${url})`);
                expect(output).toContain(example.description);
            }
        });

        it('carries both calls to action as absolute URLs', () => {
            for (const cta of [DEMO_PAGE_HERO.primaryCta, DEMO_PAGE_HERO.secondaryCta]) {
                expect(output).toContain(`[${cta.label}](https://www.ag-grid.com${cta.href})`);
            }
        });

        it('ends with a single trailing newline', () => {
            expect(output.endsWith('\n')).toBe(true);
            expect(output.endsWith('\n\n')).toBe(false);
        });
    });
});
