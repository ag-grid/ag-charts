/**
 * Example runner pages
 */
const isExamplePage = (page: string) => {
    return page.includes('/examples/');
};

/*
 * Internal debugging pages
 */
const isDebugPage = (page: string) => {
    return page.includes('/debug/');
};

/*
 * Documentation redirect pages
 */
const isRedirectPage = (page: string) => {
    return (
        page.endsWith('/documentation/') ||
        page.endsWith('/react/') ||
        page.endsWith('/angular/') ||
        page.endsWith('/javascript/') ||
        page.endsWith('/vue/')
    );
};

/*
 * Exclude specific pages
 */
const isNonPublicContent = (page: string) => {
    return page.endsWith('/style-guide/');
};

/*
 * Test pages for integration testing
 */
export const isTestPage = (page: string) => {
    return page.endsWith('-test/') || page.endsWith('-test') || page.endsWith('/benchmarks');
};

const filterIgnoredPages = (page: string) => {
    return (
        !isExamplePage(page) &&
        !isDebugPage(page) &&
        !isTestPage(page) &&
        !isRedirectPage(page) &&
        !isNonPublicContent(page)
    );
};

export function getSitemapConfig() {
    return {
        filter: filterIgnoredPages,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date(),
    };
}
