import { YOUTUBE_LICENSE_PRICING_URL } from '@ag-website-shared/constants';
import { describe, expect, it } from 'vitest';

import { buildLicensePricingMarkdown } from './buildLicensePricingMarkdown';

describe('buildLicensePricingMarkdown', () => {
    const output = buildLicensePricingMarkdown({ siteRoot: 'https://www.ag-grid.com/' });

    it('emits frontmatter and the page H1', () => {
        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain('title: "AG Charts: Licence & Pricing"');
        expect(output).toContain('\n# AG Charts: Licence & Pricing');
    });

    it('lists the AG Charts plans with prices in a table', () => {
        expect(output).toContain('## Plans');
        expect(output).toContain('AG Charts Enterprise');
        expect(output).toContain('$499 USD per developer');
        // Community plans are free; the bundle folds its description into the plan name.
        expect(output).toContain('Free');
        expect(output).toContain('Enterprise Bundle (AG Grid Enterprise & AG Charts Enterprise)');
        // The charts page defaults to the charts view, so grid-only plans are excluded.
        expect(output).not.toContain('$999 USD per developer');
    });

    it('renders the charts feature-comparison matrix with tick/cross marks and resolved links', () => {
        expect(output).toContain('## Feature Comparison');
        expect(output).toContain('| Feature | Community | Enterprise | Bundle |');
        // A known charts feature row: Bar, linked to its docs page. (The origin is baked
        // in from CHARTS_SITE_URL, which is unset under test, so assert only the path.)
        expect(output).toMatch(/\[Bar\]\([^)]*bar-series/);
        expect(output).toContain('✓');
        expect(output).toContain('✗');
    });

    it('renders a feature detail inline when present', () => {
        // Enterprise Support carries a per-column `detail` string.
        expect(output).toContain('Enterprise support via Zendesk');
    });

    it('includes the trial section and key links', () => {
        expect(output).toContain('## 30-Day Enterprise Bundle Trial');
        expect(output).toContain('[Get a trial licence](https://www.ag-grid.com/');
        expect(output).toContain('community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence');
        expect(output).toContain('[Installing Your Licence Key](https://www.ag-grid.com/');
        expect(output).toContain(YOUTUBE_LICENSE_PRICING_URL);
    });

    it('ends with a single trailing newline', () => {
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});
