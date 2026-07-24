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
            '[See the charts](https://www.ag-grid.com/gallery?utm_source=charts-homepage&utm_medium=hero-section&utm_campaign=homepage-cta)'
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
            '[Get Started For Free](https://www.ag-grid.com/react/quick-start/?utm_source=charts-homepage&utm_medium=features-section&utm_campaign=homepage-cta)'
        );
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

    it('lists the latest releases with blog links and highlights', () => {
        expect(output).toContain(
            '### [14.1.0 — August 5th, 2026](https://blog.ag-grid.com/whats-new-in-ag-charts-14-1/)'
        );
        expect(output).toContain('- Series Label Collisions');
        // A .0 minor release links to the major-only blog URL.
        expect(output).toContain('](https://blog.ag-grid.com/whats-new-in-ag-charts-14/)');
    });

    it('renders each FAQ question as an H3', () => {
        expect(output).toContain('### What are AG Charts JavaScript charts?');
    });

    it('ends with a single trailing newline', () => {
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});
