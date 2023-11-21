// Example runner pages
const isExamplePage = (page: string) => {
    return page.includes('/examples/');
};

// Internal debugging pages
const isDebugPage = (page: string) => {
    return page.includes('/debug/');
};

// Test pages for integration testing
const isTestPage = (page: string) => {
    return page.includes('-test/');
};

const filterPages = (page: string) => {
    return !isExamplePage(page) && !isDebugPage(page) && !isTestPage(page);
};

export function getSitemapConfig() {
    return {
        filter: filterPages,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date(),
    };
}
