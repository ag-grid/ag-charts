import { PRODUCTION_GRID_SITE_URL } from '../constants';

/*
 * The conference session, community and contact pages are built into all three AG sites, so each
 * page is served at three addresses: the grid one (e.g. `/session/opening-keynote/`) plus a
 * `/charts/` and a `/studio/` copy. Every copy used to canonicalise to itself, so search engines
 * indexed three separate copies of one page. The grid address is the one to keep: each copy points
 * its `<link rel="canonical">` at the grid URL for the same route, and drops out of this site's
 * sitemap. The copies stay live and the navigation is unchanged - only the search signals move.
 */

/**
 * Route subtrees whose pages belong to the grid site. Matched against the route path (the pathname
 * with this site's base stripped), so one entry covers the grid page and both prefixed copies.
 * Whole subtrees rather than a page list because the session pages are generated from a shared
 * session list - a talk added later must not silently reintroduce a duplicate. Kept identical
 * across the three sites: it states which routes the grid site owns, not which of them this site
 * happens to build, so a copy added here later is already covered.
 */
const GRID_OWNED_ROUTES = ['/session/', '/community/', '/contact/'];

/**
 * The pathname with this site's base path removed, so `/charts/session/x/` becomes `/session/x/`. A
 * pathname that does not carry the base (dev, where the site is served from the root) is already a
 * route path.
 */
const routePathOf = (pathname: string, siteBasePath: string): string => {
    const basePath = (siteBasePath || '').replace(/\/$/, '');

    return basePath && pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
};

/** Whether a route path names a page the grid site owns. */
const isGridOwnedRoute = (routePath: string): boolean =>
    // `startsWith` covers the page and anything below it; the second test catches the route's own
    // page when it is served without a trailing slash.
    GRID_OWNED_ROUTES.some((route) => routePath.startsWith(route) || routePath === route.slice(0, -1));

/**
 * Absolute canonical URL for a page: the grid URL for a grid-owned route, otherwise the page's own
 * URL. The base path is read off `canonicalUrlBase` rather than the environment-dependent
 * `SITE_BASE_URL` so it always matches the URL being emitted.
 *
 * @param pageUrl This page's own absolute URL.
 * @param canonicalUrlBase This site's canonical base, e.g. `https://www.ag-grid.com/charts`.
 */
export const getCanonicalUrl = (pageUrl: URL, canonicalUrlBase: string): URL => {
    const routePath = routePathOf(pageUrl.pathname, new URL(canonicalUrlBase).pathname);

    return isGridOwnedRoute(routePath) ? new URL(routePath, PRODUCTION_GRID_SITE_URL) : pageUrl;
};

/**
 * Whether a built page canonicalises to the grid site rather than to itself. The sitemap uses this
 * to leave those copies out: a sitemap should only carry canonical URLs, so listing a copy would
 * contradict the `<link rel="canonical">` that same page emits. The pages stay live and crawlable -
 * only the sitemap entry goes.
 *
 * @param page A page URL or route path, as handed to the sitemap filter.
 * @param siteBasePath This site's base path, e.g. `/charts`.
 */
export const isCanonicalisedToGridSite = (page: string, siteBasePath: string): boolean =>
    isGridOwnedRoute(routePathOf(new URL(page, PRODUCTION_GRID_SITE_URL).pathname, siteBasePath));
