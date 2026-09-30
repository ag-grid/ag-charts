// Bundled with the demo for the same reason as the flags — see flags.ts.
import chrome from './assets/browsers/chrome.svg';
import edge from './assets/browsers/edge.svg';
import firefox from './assets/browsers/firefox.svg';
import safari from './assets/browsers/safari.svg';
import type { Browser } from './types';

// The "Other" bucket has no icon.
const ICON_BY_BROWSER: Partial<Record<Browser, string>> = {
    Chrome: chrome,
    Edge: edge,
    Firefox: firefox,
    Safari: safari,
};

export function browserIconUrl(browser: string): string | undefined {
    return ICON_BY_BROWSER[browser as Browser];
}
