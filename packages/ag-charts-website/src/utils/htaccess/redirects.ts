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
    { from: '/javascript/fonts', to: '/javascript/text' },
    { from: '/angular/fonts', to: '/angular/text' },
    { from: '/react/fonts', to: '/react/text' },
    { from: '/vue/fonts', to: '/vue/text' },
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

    // Permanently removed → 410 Gone. Listed first so they win over the broad rules below.
    { fromPattern: '^/archive(/.*)?$', gone: true }, // per-release QA artifact, not part of the live IA

    // No charts-scoped privacy page exists; the canonical policy lives on the apex site.
    { fromPattern: '^/privacy(/.*)?$', to: 'https://www.ag-grid.com/privacy/' },

    // Legacy "{fw}-charts/{fw}/<page>" docs scheme → current "{fw}/<page>" (all page slugs verified in content/docs).
    // Require a non-empty page slug ((.+)): an empty slug would target the bare "{fw}/" root, which the
    // "^/{fw}/?$" rule redirects again — a chain. The empty case instead falls through to the broad
    // "^/{fw}-charts/.+$" fallback below, reaching quick-start in a single hop.
    { fromPattern: '^/javascript-charts/javascript/(.+)$', to: '/javascript/$1' },
    { fromPattern: '^/angular-charts/angular/(.+)$', to: '/angular/$1' },
    { fromPattern: '^/react-charts/react/(.+)$', to: '/react/$1' },
    { fromPattern: '^/vue-charts/vue/(.+)$', to: '/vue/$1' },
    // enterprise-charts/react/<page> was the enterprise framework docs (security, accessibility, …) → react docs.
    { fromPattern: '^/enterprise-charts/react/(.+)$', to: '/react/$1' },

    // Legacy "{fw}-charts/gallery|options/..." → framework-agnostic section landing.
    { fromPattern: '^/[a-z]+-charts/gallery(/.*)?$', to: '/gallery/' },
    { fromPattern: '^/[a-z]+-charts/options(/.*)?$', to: '/options/' },

    // Remaining "{fw}-charts/<sub-path>" (license-pricing, whats-new, …) → framework landing.
    // "/{fw}-charts" and "/{fw}-charts/" are live marketing landing pages
    // (src/pages/{fw}-charts.astro) and must not be redirected. The `.+$` (non-empty sub-path)
    // is not enough on its own: each landing page builds to a directory with an index.html, and
    // Apache's mod_dir resolves a bare "/{fw}-charts/" request via an internal sub-request for
    // "/{fw}-charts/index.html". That sub-request is re-evaluated by mod_alias, so a plain `.+$`
    // matches "index.html" and the redirect fires on the bare landing page — and for
    // enterprise-charts (target is its own directory) that is an infinite loop. The
    // `(?!index\.html$)` negative lookahead excludes the DirectoryIndex resource so the landing
    // page serves while real legacy sub-paths still redirect.
    { fromPattern: '^/enterprise-charts/(?!index\\.html$).+$', to: '/enterprise-charts/' },
    { fromPattern: '^/javascript-charts/(?!index\\.html$).+$', to: '/javascript/quick-start/' },
    { fromPattern: '^/angular-charts/(?!index\\.html$).+$', to: '/angular/quick-start/' },
    { fromPattern: '^/react-charts/(?!index\\.html$).+$', to: '/react/quick-start/' },
    { fromPattern: '^/vue-charts/(?!index\\.html$).+$', to: '/vue/quick-start/' },

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
