import { describe, expect, it } from 'vitest';

import { buildGalleryMarkdown } from './buildGalleryMarkdown';

describe('buildGalleryMarkdown', () => {
    const output = buildGalleryMarkdown({ siteRoot: 'https://www.ag-grid.com/' });

    it('emits frontmatter and the page H1', () => {
        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain('title: "Gallery"');
        expect(output).toContain('\n# AG Charts Gallery');
    });

    it('renders the trial and pricing CTAs', () => {
        expect(output).toContain(
            '[Free Trial](https://www.ag-grid.com/react/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence) | [Buy Now](https://www.ag-grid.com/license-pricing/)'
        );
    });

    it('groups examples under a chart-type heading', () => {
        expect(output).toContain('## Bar');
        expect(output).toContain('## Line');
    });

    it('flags enterprise chart types in their heading', () => {
        expect(output).toContain('## Map (Enterprise)');
        expect(output).not.toContain('## Bar (Enterprise)');
    });

    it('links each example to its live gallery demo (absolute URL)', () => {
        expect(output).toContain('- [Bar Chart](https://www.ag-grid.com/gallery/simple-bar/)');
        expect(output).toContain('- [Stacked Bar Chart](https://www.ag-grid.com/gallery/stacked-bar/)');
    });

    it('ends with a single trailing newline', () => {
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});
