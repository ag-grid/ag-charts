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
 * Test pages for integration testing
 */
export const isTestPage = (page: string) => {
    return page.endsWith('-test/') || page.endsWith('-test') || page.endsWith('/benchmarks');
};

const filterIgnoredPages = (page: string) => {
    return !isExamplePage(page) && !isDebugPage(page) && !isTestPage(page);
};

export function getSitemapConfig() {
    return {
        filter: filterIgnoredPages,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date(),
    };
}
