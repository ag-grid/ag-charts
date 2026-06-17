export type SimpleRedirectRule = { from: string; to: string };
export type RedirectMatchRule = { fromPattern: string; to: string };
export type Redirect = SimpleRedirectRule | RedirectMatchRule;

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
];
