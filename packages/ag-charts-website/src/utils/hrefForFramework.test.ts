import { describe, expect, it } from 'vitest';

import { hrefForFramework } from './hrefForFramework';

const pageName = 'community-vs-enterprise';

describe('hrefForFramework', () => {
    it('moves a framework page link to the given framework', () => {
        expect(hrefForFramework({ href: '/charts/react/community-vs-enterprise/', pageName, framework: 'vue' })).toBe(
            '/charts/vue/community-vs-enterprise/'
        );
    });

    it('works from any framework, so a link can be moved more than once', () => {
        expect(
            hrefForFramework({ href: '/charts/angular/community-vs-enterprise/', pageName, framework: 'javascript' })
        ).toBe('/charts/javascript/community-vs-enterprise/');
    });

    it('keeps the base URL and the hash', () => {
        expect(
            hrefForFramework({
                href: 'https://www.ag-grid.com/charts/react/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence',
                pageName,
                framework: 'angular',
            })
        ).toBe(
            'https://www.ag-grid.com/charts/angular/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence'
        );
    });

    it('leaves links to other pages alone', () => {
        expect(hrefForFramework({ href: '/charts/react/quick-start/', pageName, framework: 'vue' })).toBe(
            '/charts/react/quick-start/'
        );
        expect(hrefForFramework({ href: '/license-pricing/', pageName, framework: 'vue' })).toBe('/license-pricing/');
    });

    it('leaves AG Grid links alone', () => {
        expect(
            hrefForFramework({
                href: 'https://www.ag-grid.com/react-data-grid/community-vs-enterprise/',
                pageName,
                framework: 'vue',
            })
        ).toBe('https://www.ag-grid.com/react-data-grid/community-vs-enterprise/');
    });
});
