export type SimpleRedirectRule = { from: string; to: string };
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

    // Legacy slug → renamed docs page.
    { from: '/javascript/toolbar/', to: '/javascript/financial-charts-toolbar/' },
    { from: '/react/toolbar/', to: '/react/financial-charts-toolbar/' },
    { from: '/react/line/', to: '/react/line-series/' },

    // Rules are base-relative; getRedirectRules() splices in the /charts base.
    // RedirectMatch is first-match-wins, so order is load-bearing: specific before broad.

    // Do NOT broaden this to `^/archive(/.*)?$`: `/archive/<version>/` holds live, indexed
    // archived docs, not QA artifacts.

    // `/?$` matches the bare index only, never `/archive/<version>/…`, so archived docs still serve.
    { fromPattern: '^/archive/?$', to: '/documentation-archive/' },

    // Must stay a 410 rather than a 301 to the apex /privacy; the charts subdir is deliberately
    // its sole authority so the slashed form returns a single 410.
    { fromPattern: '^/privacy(/.*)?$', gone: true },

    // Legacy "{fw}-charts/{fw}/<page>" docs scheme → current "{fw}/<page>". The slug must be
    // non-empty, or this would target the bare "{fw}/" root and chain into the "^/{fw}/?$" rule.
    { fromPattern: '^/javascript-charts/javascript/(.+)$', to: '/javascript/$1' },
    { fromPattern: '^/angular-charts/angular/(.+)$', to: '/angular/$1' },
    { fromPattern: '^/react-charts/react/(.+)$', to: '/react/$1' },
    { fromPattern: '^/vue-charts/vue/(.+)$', to: '/vue/$1' },
    // Legacy enterprise framework docs (security, accessibility, …) → react docs.
    { fromPattern: '^/enterprise-charts/react/(.+)$', to: '/react/$1' },

    // Legacy "{fw}-charts/gallery|options/..." → framework-agnostic section landing.
    { fromPattern: '^/[a-z]+-charts/gallery(/.*)?$', to: '/gallery/' },
    { fromPattern: '^/[a-z]+-charts/options(/.*)?$', to: '/options/' },

    { fromPattern: '^/enterprise-charts/(?!index\\.html$).+$', to: '/enterprise-charts/' },

    // Framework-agnostic legacy layouts: core = main docs, side = side-nav docs.
    { fromPattern: '^/core/(.*)', to: '/javascript/$1' },
    { fromPattern: '^/side/(.*)', to: '/javascript/$1' },

    // Framework-agnostic "server-side-rendering" is a docs slug → framework-scoped page.
    { fromPattern: '^/server-side-rendering(/.*)?$', to: '/javascript/server-side-rendering/' },

    // Legacy aggregate index pages with no current equivalent → first page of the matching nav section.
    { fromPattern: '^/(javascript|angular|react|vue)/series(/.*)?$', to: '/$1/bar-series/' },
    { fromPattern: '^/(javascript|angular|react|vue)/axes(/.*)?$', to: '/$1/axes-configuration/' },
];
