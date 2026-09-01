import { FRAMEWORK_REDIRECT_PATH } from '../constants';
import { isCanonicalisedToGridSite } from './canonicalUrl';

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
 * Demo app examples: published for internal review, but unlinked and kept out of search.
 */
export const isDemoPage = (page: string) => {
    return page.includes('/demos/') || page.endsWith('/demos');
};

/*
 * Documentation redirect pages
 */
const isRedirectPage = (page: string) => {
    return (
        page.endsWith('/documentation/') ||
        page.endsWith('/licensing/') ||
        page.endsWith('/react/') ||
        page.endsWith('/angular/') ||
        page.endsWith('/javascript/') ||
        page.endsWith('/vue/') ||
        page.includes(`/${FRAMEWORK_REDIRECT_PATH}/`)
    );
};

/*
 * Exclude specific pages
 */
const isNonPublicContent = (page: string) => {
    return (
        page.endsWith('/style-guide/') ||
        // Post-submission confirmations are robots-disallowed, so listing them here would make
        // Search Console report "submitted URL blocked by robots.txt".
        page.endsWith('/contact/failure/') ||
        page.endsWith('/contact/success/')
    );
};

/*
 * Internal test pages: `-test` for manual harnesses, `-e2e` for Playwright specs.
 */
export const isInternalPage = (page: string) => {
    return (
        page.endsWith('-test/') ||
        page.endsWith('-test') ||
        page.endsWith('-e2e/') ||
        page.endsWith('-e2e') ||
        page.endsWith('/benchmarks')
    );
};

const filterIgnoredPages = (page: string, siteBasePath: string) => {
    return (
        !isExamplePage(page) &&
        !isDebugPage(page) &&
        !isDemoPage(page) &&
        !isInternalPage(page) &&
        !isRedirectPage(page) &&
        !isNonPublicContent(page) &&
        // Copies of pages the grid site owns canonicalise there, so listing them here would
        // contradict the canonical the page itself emits.
        !isCanonicalisedToGridSite(page, siteBasePath)
    );
};

/**
 * Get the sitemap configuration for generating the sitemap xml file
 *
 * There are 2 locations where the sitemap is generated:
 *
 * 1. Sitemap xml (`sitemap-0.xml`) - after a complete build, the sitemap xml file is generated in the astro `dist` folder. It is also cached in `[documentation]/.astro/cache/sitemap/sitemap-0.xml` (from the `ag-cache-sitemap` astro plugin), which refreshes the cache whenever the page list changed
 * 2. Sitemap page (`/sitemap`) - this page is generated from the sitemap xml, however since the page cannot be generated until the build is complete, it either uses what is in the cache (from a previous build), or pulls it from `LIVE_SITEMAP_URL`
 *
 * Because of (2), a build may need to run twice for the sitemap page to list the pages the same build generated. `buildWithSitemapCache` only does that when the page list actually moved - see that script for the comparison it makes.
 *
 * To generate the sitemap locally:
 *
 * 1. With localhost links - run `nx build ag-charts-website --clean-cache=true --run-second-build=true` to clear out the cache and allow the second build, so the sitemap page is updated. Preview with `nx preview ag-charts-website`
 * 2. With production links - run the production preview with `nx preview ag-charts-website -c production`
 *
 * Check the sitemap locally at `http://localhost:4601/charts/sitemap-0.xml` and `http://localhost:4601/charts/sitemap`
 */
export function getSitemapConfig(siteBasePath: string) {
    return {
        filter: (page: string) => filterIgnoredPages(page, siteBasePath),
        lastmod: new Date(),
        namespaces: {
            news: false,
            xhtml: false,
            image: false,
            video: false,
        },
    };
}
