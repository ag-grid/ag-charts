import { describe, expect, it } from 'vitest';

import { hrefForFramework } from './hrefForFramework';

describe('hrefForFramework', () => {
    it('moves a framework page link to the given framework', () => {
        expect(hrefForFramework({ href: '/charts/react/community-vs-enterprise/', framework: 'vue' })).toBe(
            '/charts/vue/community-vs-enterprise/'
        );
    });

    it('works from any framework, so a link can be moved more than once', () => {
        expect(hrefForFramework({ href: '/charts/angular/quick-start/', framework: 'javascript' })).toBe(
            '/charts/javascript/quick-start/'
        );
    });

    it('does not depend on the site base path', () => {
        expect(hrefForFramework({ href: '/react/community-vs-enterprise/', framework: 'vue' })).toBe(
            '/vue/community-vs-enterprise/'
        );
    });

    it('keeps the base URL, the query and the hash', () => {
        expect(
            hrefForFramework({
                href: 'https://www.ag-grid.com/charts/react/community-vs-enterprise/?utm_source=charts-homepage#request-a-30-day-enterprise-bundle-trial-licence',
                framework: 'angular',
            })
        ).toBe(
            'https://www.ag-grid.com/charts/angular/community-vs-enterprise/?utm_source=charts-homepage#request-a-30-day-enterprise-bundle-trial-licence'
        );
    });

    it('leaves links with no framework path, and AG Grid links, alone', () => {
        expect(hrefForFramework({ href: '/license-pricing/', framework: 'vue' })).toBe('/license-pricing/');
        expect(
            hrefForFramework({
                href: 'https://www.ag-grid.com/react-data-grid/community-vs-enterprise/',
                framework: 'vue',
            })
        ).toBe('https://www.ag-grid.com/react-data-grid/community-vs-enterprise/');
    });
});
