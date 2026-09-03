import { describe, expect, it } from 'vitest';

import { buildHomepageMarkdown } from './buildHomepageMarkdown';

describe('buildHomepageMarkdown', () => {
    const output = buildHomepageMarkdown({ siteRoot: 'https://www.ag-grid.com/' });

    it('emits frontmatter and the hero H1', () => {
        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain('title: "JavaScript Charts | AG Charts"');
        expect(output).toContain('\n# The Best JavaScript Charts in the World');
    });

    it('renders the hero subheading and its CTA link', () => {
        expect(output).toContain('The professional choice for developers building enterprise applications');
        expect(output).toContain(
            '[See the charts](https://www.ag-grid.com/gallery/?utm_source=charts-homepage&utm_medium=hero-section&utm_campaign=homepage-cta)'
        );
    });

    it('renders each landing section heading', () => {
        expect(output).toContain('## JavaScript Charts Designed for Every Use Case');
        expect(output).toContain('## Interactive Financial Charts for Trading and Analysis');
        expect(output).toContain('## Customisable JavaScript Map Charts for Geographical Data Visualisation');
        expect(output).toContain('## AG Grid Integrated Charts, Powered by AG Charts');
        expect(output).toContain('## Regular Releases, Updates, and Enhancements');
        expect(output).toContain('## FAQs');
    });

    it('resolves section CTA links absolutely', () => {
        expect(output).toContain(
            '[Explore the Docs](https://www.ag-grid.com/react/quick-start/?utm_source=charts-homepage&utm_medium=features-section&utm_campaign=homepage-cta)'
        );
    });

    it("renders the gallery section's CTAs as one row", () => {
        expect(output).toMatch(/\[Explore the Docs\]\([^)]*\) \| \[Free Trial\]\([^)]*\) \| \[Buy Now\]\([^)]*\)/);
        expect(output).toMatch(/\[Buy Now\]\(https:\/\/www\.ag-grid\.com\/[^)]*license-pricing\/[^)]*\)/);
    });

    it('resolves framework agnostic CTA links to the default framework', () => {
        // `/r/{page}` redirects client side, which the tools reading this markdown don't run.
        expect(output).toContain(
            '[Free Trial](https://www.ag-grid.com/react/community-vs-enterprise/?utm_source=charts-homepage&utm_medium=features-section&utm_campaign=homepage-cta#request-a-30-day-enterprise-bundle-trial-licence)'
        );
        expect(output).not.toContain('ag-grid.com/r/');
    });

    it('converts the integrated subHeadingHtml links to markdown (no raw anchor tags)', () => {
        expect(output).toContain('[Integrated Charts](https://www.ag-grid.com/react-data-grid/integrated-charts/)');
        expect(output).not.toContain('<a href');
    });

    it('renders the map cards as H3 sections', () => {
        expect(output).toContain('### Geographic Areas');
        expect(output).toContain('### Routes & Connections');
        expect(output).toContain('### Markers & POIs');
    });

    it('renders each FAQ question as an H3', () => {
        expect(output).toContain('### What are AG Charts JavaScript charts?');
    });

    it('ends with a single trailing newline', () => {
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});
