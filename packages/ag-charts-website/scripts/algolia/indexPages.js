'use strict';

/**
 * Builds the ordered list of website pages that `update-algolia.js` walks to produce Algolia
 * records.
 *
 * Two menus feed the list:
 *  - `docs-nav/nav.json` — the documentation side-nav, walked exactly as it always has been;
 *  - `api-menu/menu.json` — the "API" tab, whose framework pages were previously never indexed.
 *
 * Extracted from the indexer so the page list can be unit-tested without a built site.
 */

/** Rank of the first documentation page; each subsequent indexed page ranks one step lower. */
const DOCS_RANK_BASE = 10000;

/** Rank decrement applied per indexed page, so earlier menu entries rank higher in results. */
const RANK_STEP = 10;

/**
 * Rank of the first API-tab page. API pages rank below every documentation page so that an
 * equally-relevant docs hit wins the tie. Tune this single constant to move the API pages
 * relative to the docs pages.
 */
const API_PAGE_RANK_BASE = 1000;

/** Placeholder segment marking an API-menu entry as having a per-framework page. */
const FRAMEWORK_TOKEN = '[framework]';

/**
 * API-menu entries that must never be indexed. These are the two pure reference pages, whose
 * contents are required to stay unsearchable. They also lack a `[framework]` segment, so this
 * list is belt-and-braces rather than the only guard.
 */
const API_MENU_DENY_LIST = ['/options', '/themes-api'];

/**
 * @typedef {object} IndexPage
 * @property {string} path framework-relative page name, e.g. `events`
 * @property {string} breadcrumb `A > B > Title`
 * @property {number} rank Algolia custom-ranking value
 * @property {boolean} isApiPage whether the page came from the API tab rather than the docs nav
 */

/**
 * @param {{ docsNav: object, apiMenu: { items?: Array<object> } }} menus
 * @returns {IndexPage[]} pages in menu order — every documentation page, then every API-tab page
 */
function getIndexPages({ docsNav, apiMenu }) {
    const pages = [];
    let rank = DOCS_RANK_BASE;

    const walkDocsItems = (items, prefix) => {
        if (!items) {
            return;
        }

        const breadcrumbPrefix = prefix ? `${prefix} > ` : '';

        for (const item of items) {
            const breadcrumb = breadcrumbPrefix + item.title;

            if (item.path && !item.hidden) {
                pages.push({ path: item.path, breadcrumb, rank, isApiPage: false });
                rank -= RANK_STEP;
            }

            walkDocsItems(item.children, breadcrumb);
        }
    };

    for (const topLevelItems of Object.values(docsNav ?? {})) {
        walkDocsItems(topLevelItems);
    }

    // Stay below the last docs page even if the docs nav ever grows past the constant.
    let apiRank = Math.min(API_PAGE_RANK_BASE, rank - RANK_STEP);

    for (const item of apiMenu?.items ?? []) {
        if (!item.path || item.hidden) {
            continue;
        }
        if (API_MENU_DENY_LIST.includes(item.path) || !item.path.includes(FRAMEWORK_TOKEN)) {
            continue;
        }

        // `/[framework]/events` -> `events`; `convertToFrameworkUrl` adds the framework and slashes.
        const pagePath = item.path
            .split('/')
            .filter((segment) => segment !== '' && segment !== FRAMEWORK_TOKEN)
            .join('/');

        pages.push({ path: pagePath, breadcrumb: `API > ${item.title}`, rank: apiRank, isApiPage: true });
        apiRank -= RANK_STEP;
    }

    return pages;
}

module.exports = { getIndexPages, DOCS_RANK_BASE, RANK_STEP, API_PAGE_RANK_BASE, API_MENU_DENY_LIST };
