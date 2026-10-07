import { FRAMEWORKS } from '../../constants';

export type SimpleRedirectRule = {
    from: string;
    to: string;
    /**
     * Drop this redirect for archive builds. Archive builds omit the `sitemap()` integration
     * entirely (they're noindex), so a redirect whose target only exists when that integration
     * ran would 301 to a file the archive build never generates.
     */
    skipForArchive?: true;
};
export type RedirectMatchRule = { fromPattern: string; to: string };
// A 410 Gone rule: permanently removed with no equivalent, so it carries no `to`.
export type GoneRule = { from: string; gone: true } | { fromPattern: string; gone: true };
export type Redirect = SimpleRedirectRule | RedirectMatchRule | GoneRule;

/**
 * Where this file lives
 *
 * Useful for debugging
 */
export const REDIRECTS_FILE = 'packages/ag-charts-website/src/utils/htaccess/redirects.ts';

// redirectsChecker assumes every non-trailing-slash target is a directory containing
// index.html; sitemap-0.xml is a flat file, so it must be excluded from that check.
export const IGNORE_PAGES = ['/sitemap-0.xml'];

/** A legacy docs prefix whose pages now live, under the same slugs, below `currentPrefix`. */
export type LegacyDocsPrefix = { legacyPrefix: string; currentPrefix: string };

const legacyDocsPrefix = (legacyPrefix: string, currentPrefix: string): LegacyDocsPrefix => ({
    legacyPrefix,
    currentPrefix,
});

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A page-preserving legacy redirect from one docs prefix to another, in one hop from either slash
 * form. A last segment with a dot is a file (index.html, a .md twin, an asset) and keeps its path
 * as-is; anything else is a page slug, captured without its trailing slash and given one. The
 * slug must be non-empty, or the rule would target the bare prefix root.
 */
const pagePreservingRedirects = ({ legacyPrefix, currentPrefix }: LegacyDocsPrefix): RedirectMatchRule[] => [
    { fromPattern: `^${legacyPrefix}(.*\\.[^/]*)$`, to: `${currentPrefix}$1` },
    { fromPattern: `^${legacyPrefix}(.+?)/?$`, to: `${currentPrefix}$1/` },
];

/**
 * `rule` moved below `legacyPrefix`, for a rule whose source is a page below `currentPrefix`: the
 * legacy URL of a renamed page, sent straight to the renamed page's target. Without it the
 * page-preserving rule would send it to the current URL first, which then redirects again.
 * Emitted as a pattern rule, so Astro does not build a redirect page for every legacy spelling.
 */
function underLegacyPrefix({ legacyPrefix, currentPrefix }: LegacyDocsPrefix, rule: Redirect): Redirect[] {
    if ('from' in rule) {
        const { from, ...target } = rule;
        if (!from.startsWith(currentPrefix) || from === currentPrefix) {
            return [];
        }
        const legacyPage = `${legacyPrefix}${from.slice(currentPrefix.length)}`.replace(/\/$/, '');
        return [{ ...target, fromPattern: `^${escapeRegExp(legacyPage)}/?$` }];
    }
    const { fromPattern, ...target } = rule;
    const currentPattern = `^${escapeRegExp(currentPrefix)}`;
    const below = fromPattern.slice(currentPattern.length);
    // Only a rule for a slug below the prefix: not the prefix root (`$`), nor one whose last
    // character the remainder quantifies (`^/javascript/?$`).
    if (!fromPattern.startsWith(currentPattern) || below === '$' || /^[?*+{]/.test(below)) {
        return [];
    }
    return [{ ...target, fromPattern: `^${escapeRegExp(legacyPrefix)}${below}` }];
}

/**
 * Every legacy prefix's redirects: first a rule for each renamed page below its current prefix,
 * aimed at that page's final target and listed in the order Apache would have tried the renames on
 * the second hop, then the broad page-preserving rules.
 */
function withLegacyDocsPrefixes(rules: Array<Redirect | LegacyDocsPrefix>): Redirect[] {
    const renames = rules.filter((rule): rule is Redirect => !('legacyPrefix' in rule));
    return rules.flatMap((rule) =>
        'legacyPrefix' in rule
            ? [...renames.flatMap((rename) => underLegacyPrefix(rule, rename)), ...pagePreservingRedirects(rule)]
            : [rule]
    );
}

const RULES: Array<Redirect | LegacyDocsPrefix> = [
    { from: '/javascript/bullet-series', to: '/javascript/linear-gauge/#bullet-series' },
    { from: '/angular/bullet-series', to: '/angular/linear-gauge/#bullet-series' },
    { from: '/react/bullet-series', to: '/react/linear-gauge/#bullet-series' },
    { from: '/vue/bullet-series', to: '/vue/linear-gauge/#bullet-series' },
    { from: '/javascript/fonts', to: '/javascript/text/' },
    { from: '/angular/fonts', to: '/angular/text/' },
    { from: '/react/fonts', to: '/react/text/' },
    { from: '/vue/fonts', to: '/vue/text/' },
    // The other frameworks serve a landing hub at their root - see FRAMEWORK_LANDING_HUBS.
    { fromPattern: '^/javascript/?$', to: '/javascript/quick-start/' },

    // Legacy slug → renamed docs page.
    { from: '/javascript/toolbar/', to: '/javascript/financial-charts-toolbar/' },
    { from: '/react/toolbar/', to: '/react/financial-charts-toolbar/' },
    { from: '/react/line/', to: '/react/line-series/' },

    // SE-186: this build only ever generates sitemap-0.xml; the conventional /sitemap.xml is
    // never emitted, so crawlers probing it by convention (e.g. Bing) 404. Archive builds never
    // generate sitemap-0.xml either (see skipForArchive doc), so this redirect is dropped there.
    { from: '/sitemap.xml', to: '/sitemap-0.xml', skipForArchive: true },

    // Rules are base-relative: getRedirectRules() matches them below the deployed base. Each `to`
    // must be a final page, never another rule's source, or the redirect takes an extra hop.
    // First match wins, so order is load-bearing: specific before broad.

    // Do NOT broaden this to `^/archive(/.*)?$`: `/archive/<version>/` holds live, indexed
    // archived docs, not QA artifacts.

    // `/?$` matches the bare index only, never `/archive/<version>/…`, so archived docs still serve.
    { fromPattern: '^/archive/?$', to: '/documentation-archive/' },

    // Must stay a 410 rather than a 301 to the apex /privacy; the charts subdir is deliberately
    // its sole authority so the slashed form returns a single 410.
    { fromPattern: '^/privacy(/.*)?$', gone: true },

    // Legacy "{fw}-charts/{fw}/<page>" docs scheme → current "{fw}/<page>". The slug must be
    // non-empty, or this would target the bare "{fw}/" root and chain into the "^/{fw}/?$" rule.
    legacyDocsPrefix('/javascript-charts/javascript/', '/javascript/'),
    legacyDocsPrefix('/angular-charts/angular/', '/angular/'),
    legacyDocsPrefix('/react-charts/react/', '/react/'),
    legacyDocsPrefix('/vue-charts/vue/', '/vue/'),
    // Legacy enterprise framework docs (security, accessibility, …) → react docs.
    legacyDocsPrefix('/enterprise-charts/react/', '/react/'),

    // Legacy "{fw}-charts/gallery|options/..." → framework-agnostic section landing.
    { fromPattern: '^/[a-z]+-charts/gallery(/.*)?$', to: '/gallery/' },
    { fromPattern: '^/[a-z]+-charts/options(/.*)?$', to: '/options/' },

    { fromPattern: '^/enterprise-charts/(?!index\\.html$).+$', to: '/enterprise-charts/' },

    // Framework-agnostic legacy layouts: core = main docs, side = side-nav docs. The bare layout
    // root goes straight to quick-start; via "/javascript/" it would take a second hop.
    { fromPattern: '^/(?:core|side)/?$', to: '/javascript/quick-start/' },
    legacyDocsPrefix('/core/', '/javascript/'),
    legacyDocsPrefix('/side/', '/javascript/'),

    // Framework-agnostic "server-side-rendering" is a docs slug → framework-scoped page.
    { fromPattern: '^/server-side-rendering(/.*)?$', to: '/javascript/server-side-rendering/' },

    // Legacy aggregate index pages with no current equivalent → first page of the matching nav section.
    // One rule per framework, so each sits literally below its framework prefix for the legacy
    // prefixes to resolve.
    ...FRAMEWORKS.map((framework) => ({
        fromPattern: `^/${framework}/series(/.*)?$`,
        to: `/${framework}/bar-series/`,
    })),
    ...FRAMEWORKS.map((framework) => ({
        fromPattern: `^/${framework}/axes(/.*)?$`,
        to: `/${framework}/axes-configuration/`,
    })),
];

export const LEGACY_DOCS_PREFIXES = RULES.filter((rule): rule is LegacyDocsPrefix => 'legacyPrefix' in rule);

export const SITE_301_REDIRECTS: Redirect[] = withLegacyDocsPrefixes(RULES);
