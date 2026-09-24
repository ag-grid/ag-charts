import { getIgnoredPages } from './sitemapPages';

describe('getIgnoredPages', () => {
    test('disallows versioned archive content, with a trailing slash', () => {
        expect(getIgnoredPages()).toContain('/archive/');
    });

    test('does not disallow the bare /archive redirect, so SE-182 stays crawlable', () => {
        expect(getIgnoredPages()).not.toContain('/archive');
    });
});
