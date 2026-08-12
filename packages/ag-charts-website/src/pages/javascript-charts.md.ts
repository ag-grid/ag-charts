import { landingPageMarkdownResponse } from '@utils/markdown-pages/landingPageMarkdownResponse';

// Served at /javascript-charts.md — the markdown twin of the page, built from the same
// landing-pages/javascript-charts.json the page renders. Content-negotiates from the HTML URL on
// Accept: text/markdown (see getMarkdownNegotiationRules in htaccessRules.ts).
export const GET = () => landingPageMarkdownResponse('javascript-charts');
