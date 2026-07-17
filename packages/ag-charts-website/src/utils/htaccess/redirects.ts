export type SimpleRedirectRule = { from: string; to: string };
export type RedirectMatchRule = { fromPattern: string; to: string };
// A 410 Gone rule: the page is permanently removed with no equivalent. Has no `to`; emitted
// as `Redirect 410 <from>` or `RedirectMatch 410 "<fromPattern>"`.
export type GoneRule = { from: string; gone: true } | { fromPattern: string; gone: true };
export type Redirect = SimpleRedirectRule | RedirectMatchRule | GoneRule;

/**
 * Where this file lives
 *
 * Useful for debugging
 */
export const REDIRECTS_FILE = 'packages/ag-charts-website/src/utils/htaccess/redirects.ts';

export const IGNORE_PAGES = [];

export const SITE_301_REDIRECTS: Redirect[] = [
    { from: '/javascript/bullet-series', to: '/javascript/linear-gauge/#bullet-series' },
    { from: '/angular/bullet-series', to: '/angular/linear-gauge/#bullet-series' },
    { from: '/react/bullet-series', to: '/react/linear-gauge/#bullet-series' },
    { from: '/vue/bullet-series', to: '/vue/linear-gauge/#bullet-series' },
    { from: '/javascript/fonts', to: '/javascript/text/' },
    { from: '/angular/fonts', to: '/angular/text/' },
    { from: '/react/fonts', to: '/react/text/' },
    { from: '/vue/fonts', to: '/vue/text/' },
    { fromPattern: '^/javascript/?$', to: '/javascript/quick-start/' },
    { fromPattern: '^/react/?$', to: '/react/quick-start/' },
    { fromPattern: '^/vue/?$', to: '/vue/quick-start/' },
    { fromPattern: '^/angular/?$', to: '/angular/quick-start/' },

    // SE-60: legacy slug → renamed docs page.
    { from: '/javascript/toolbar/', to: '/javascript/financial-charts-toolbar/' },
    { from: '/react/toolbar/', to: '/react/financial-charts-toolbar/' },
    { from: '/react/line/', to: '/react/line-series/' },

    // --- SE-61: legacy AG Charts URLs that currently 404 ---
    // Rules are BASE-RELATIVE; getRedirectRules() splices in the /charts base for both pattern and target.
    // RedirectMatch is first-match-wins, so order is load-bearing: specific before broad.

    // NB: do NOT add a blanket `^/archive(/.*)?$` 410 here. `/archive/<version>/` holds the live,
    // indexed archived version docs (listed on /documentation-archive and in the sitemap), not QA
    // artifacts — 410-ing them removes real content. The CSP <If> block also grants these pages
    // `unsafe-eval` because they run example-runners, i.e. they are expected to be served.

    // Bare archive index → the live archived-versions landing (documentation-archive.astro), which
    // lists every archived version and rebuilds current each deploy — no version hardcoded. `/?$`
    // matches `/archive` and `/archive/` only, never `/archive/<version>/…`, so every version's docs
    // still serve. Mirrors the grid site's `^/archive/?$` → `/documentation-archive`.
    { fromPattern: '^/archive/?$', to: '/documentation-archive/' },

    // No charts-scoped privacy page exists and none should be served — it is permanently Gone (410).
    // Do NOT 301 to the apex /privacy policy: /charts/privacy must return 410 Gone (SE-66). This is
    // also why /charts/privacy is deliberately NOT mirrored into the grid docroot — the charts subdir
    // stays its sole authority so the slashed form returns a single 410.
    { fromPattern: '^/privacy(/.*)?$', gone: true },

    // Legacy "{fw}-charts/{fw}/<page>" docs scheme → current "{fw}/<page>" (all page slugs verified in content/docs).
    // Require a non-empty page slug ((.+)): an empty slug would target the bare "{fw}/" root, which the
    // "^/{fw}/?$" rule redirects again — a chain. An empty slug therefore does not match here and is left
    // to serve/404 (there is no broad "^/{fw}-charts/.+$" fallback for these frameworks).
    { fromPattern: '^/javascript-charts/javascript/(.+)$', to: '/javascript/$1' },
    { fromPattern: '^/angular-charts/angular/(.+)$', to: '/angular/$1' },
    { fromPattern: '^/react-charts/react/(.+)$', to: '/react/$1' },
    { fromPattern: '^/vue-charts/vue/(.+)$', to: '/vue/$1' },
    // enterprise-charts/react/<page> was the enterprise framework docs (security, accessibility, …) → react docs.
    { fromPattern: '^/enterprise-charts/react/(.+)$', to: '/react/$1' },

    // Legacy "{fw}-charts/gallery|options/..." → framework-agnostic section landing.
    { fromPattern: '^/[a-z]+-charts/gallery(/.*)?$', to: '/gallery/' },
    { fromPattern: '^/[a-z]+-charts/options(/.*)?$', to: '/options/' },

    { fromPattern: '^/enterprise-charts/(?!index\\.html$).+$', to: '/enterprise-charts/' },

    // Framework-agnostic legacy layouts: core = main docs, side = side-nav docs.
    // All page slugs verified in content/docs → preserve the page under the javascript (default) framework.
    { fromPattern: '^/core/(.*)', to: '/javascript/$1' },
    { fromPattern: '^/side/(.*)', to: '/javascript/$1' },

    // Framework-agnostic "server-side-rendering" is a docs slug → framework-scoped page.
    { fromPattern: '^/server-side-rendering(/.*)?$', to: '/javascript/server-side-rendering/' },

    // Legacy aggregate index pages with no current equivalent → first page of the matching nav section.
    { fromPattern: '^/(javascript|angular|react|vue)/series(/.*)?$', to: '/$1/bar-series/' },
    { fromPattern: '^/(javascript|angular|react|vue)/axes(/.*)?$', to: '/$1/axes-configuration/' },
];
