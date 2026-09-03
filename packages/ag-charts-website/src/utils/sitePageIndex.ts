import type { CategorizedSitemap } from '@ag-website-shared/components/sitemap/Sitemap';
import type { LlmsTxtSection } from '@utils/agentReadinessFiles';
import { toTitle } from '@utils/toTitle';

/**
 * Turn the parsed sitemap into the "Site pages" index `llms.txt` publishes below the docs index.
 *
 * The sitemap is the site's own complete URL list, so publishing it is what makes the index
 * complete rather than curated. Documentation URLs are dropped here because the docs index
 * already lists them in navigation order.
 */

/** Only some environments serve the site under `/charts`; `parseSitemap` strips it the same way. */
const CHARTS_PREFIX = '/charts';

/** `/charts/react/bar-series/` → `{ framework: 'react', pageName: 'bar-series' }`. */
const DOCS_PATH = /^\/(javascript|react|angular|vue)\/([^/]+)\/?$/;

/** Docs pages neither nav reaches, so they are published rather than dropped with the rest. */
const UNLISTED_DOCS_GROUP = 'Documentation > Not in the navigation';

interface SitePageIndexParams {
    parsedSitemap: CategorizedSitemap;
    /** Every docs page the navs list. */
    navPages: Set<string>;
    /** The framework whose docs URLs the index publishes, e.g. `javascript`. */
    canonicalFramework: string;
}

function docsPath(url: string): { framework: string; pageName: string } | null {
    const { pathname } = new URL(url);
    const path = pathname.startsWith(CHARTS_PREFIX) ? pathname.slice(CHARTS_PREFIX.length) : pathname;
    const match = DOCS_PATH.exec(path);
    return match ? { framework: match[1], pageName: match[2] } : null;
}

export function buildSitePageIndex({
    parsedSitemap,
    navPages,
    canonicalFramework,
}: SitePageIndexParams): LlmsTxtSection[] {
    const siteIndex: LlmsTxtSection[] = [];
    const unlisted: LlmsTxtSection['links'] = [];

    for (const category of Object.keys(parsedSitemap)) {
        const links: LlmsTxtSection['links'] = [];

        for (const { url, pageName } of parsedSitemap[category]) {
            const docs = docsPath(url);
            if (!docs) {
                links.push({ title: pageName, url });
                continue;
            }
            // Non-canonical frameworks are the same pages under a different segment; the docs
            // index states the substitution rather than repeating every page four times.
            if (docs.framework !== canonicalFramework || navPages.has(docs.pageName)) {
                continue;
            }
            unlisted.push({ title: toTitle(docs.pageName), url });
        }

        if (links.length) {
            siteIndex.push({ title: category, links });
        }
    }

    if (unlisted.length) {
        siteIndex.push({ title: UNLISTED_DOCS_GROUP, links: unlisted });
    }

    return siteIndex;
}
