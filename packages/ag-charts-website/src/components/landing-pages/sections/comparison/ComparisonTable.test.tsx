import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ComparisonTable from './ComparisonTable';

// The test environment resolves SVG imports to data URLs, which `Icon` cannot render as a tag.
vi.mock('@ag-website-shared/components/icon/Icon', () => ({ Icon: () => null }));
vi.mock('@constants', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@constants')>()),
    GRID_URL: 'https://www.ag-grid.com',
    CHARTS_SITE_URL: 'https://www.ag-grid.com/charts',
}));

function getFeatureHrefs() {
    const html = renderToStaticMarkup(<ComparisonTable />);
    return [...html.matchAll(/<a href="([^"]*)" target="_blank"/g)].map(([, href]) => href);
}

describe('ComparisonTable', () => {
    it('resolves every shared feature matrix link to a site url', () => {
        const hrefs = getFeatureHrefs();

        expect(hrefs.length).toBeGreaterThan(0);
        expect(hrefs.filter((href) => !href.startsWith('https://www.ag-grid.com/'))).toEqual([]);
    });

    it('links features to the React pages in the served HTML', () => {
        const hrefs = getFeatureHrefs();

        expect(hrefs).toContain('https://www.ag-grid.com/react-data-grid/community-vs-enterprise/');
        expect(hrefs).toContain('https://www.ag-grid.com/charts/react/community-vs-enterprise/');
    });
});
