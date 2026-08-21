import { describe, expect, it } from 'vitest';

import { withDefaultFramework } from './withDefaultFramework';

describe('withDefaultFramework', () => {
    it('swaps the framework redirect segment for the default framework', () => {
        expect(withDefaultFramework('/r/quick-start/')).toBe('/react/quick-start/');
    });

    it('keeps the query and fragment of a redirect url', () => {
        expect(withDefaultFramework('/r/community-vs-enterprise/?utm_source=charts#trial')).toBe(
            '/react/community-vs-enterprise/?utm_source=charts#trial'
        );
    });

    it.each(['/license-pricing/', '/react/quick-start/', '/gallery', '#anchor', 'https://www.ag-grid.com/r/security/'])(
        'leaves %s unchanged',
        (url) => {
            expect(withDefaultFramework(url)).toBe(url);
        }
    );
});
