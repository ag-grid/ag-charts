import { describe, expect, it } from 'vitest';

import { buildGalleryMarkdown } from './buildGalleryMarkdown';

describe('buildGalleryMarkdown', () => {
    const output = buildGalleryMarkdown({ siteRoot: 'https://www.ag-grid.com/' });

    it('emits frontmatter and the page H1', () => {
        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain('title: "AG Charts Gallery - 100+ JavaScript Chart Examples | AG Charts"');
        expect(output).toContain('\n# AG Charts Gallery - JavaScript Chart Examples\n');
    });

    it('serves the same intro as the page', () => {
        expect(output).toContain('The AG Charts gallery contains over 100 live, interactive chart examples');
    });

    it('renders the trial and pricing CTAs', () => {
        expect(output).toContain(
            '[Free Trial](https://www.ag-grid.com/react/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence) | [Buy Now](https://www.ag-grid.com/license-pricing/)'
        );
    });

    it('groups examples under a chart-type heading', () => {
        expect(output).toContain('## Bar Charts');
        expect(output).toContain('## Line Charts');
        expect(output).toContain('## Org Charts');
    });

    it('flags enterprise chart types in their heading', () => {
        expect(output).toContain('## Map Charts (Enterprise)');
        expect(output).not.toContain('## Bar Charts (Enterprise)');
    });

    it('anchors each example on the H1 its page serves', () => {
        expect(output).toContain('- [Bar Chart Example](https://www.ag-grid.com/gallery/simple-bar/)');
        expect(output).toContain('- [Stacked Bar Chart Example](https://www.ag-grid.com/gallery/stacked-bar/)');
        expect(output).toContain(
            '- [Horizontal Bar Chart Example](https://www.ag-grid.com/gallery/simple-horizontal-bar/)'
        );
    });

    it('ends with a single trailing newline', () => {
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});
