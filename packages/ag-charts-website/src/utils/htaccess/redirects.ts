export type SimpleRedirectRule = { from: string; to: string };
export type RedirectMatchRule = { fromPattern: string; to: string };
export type Redirect = SimpleRedirectRule | RedirectMatchRule;

export const SITE_301_REDIRECTS: Redirect[] = [
    { from: '/javascript/bullet-series', to: '/javascript/linear-gauge/#bullet-series' },
    { from: '/angular/bullet-series', to: '/angular/linear-gauge/#bullet-series' },
    { from: '/react/bullet-series', to: '/react/linear-gauge/#bullet-series' },
    { from: '/vue/bullet-series', to: '/vue/linear-gauge/#bullet-series' },
];
