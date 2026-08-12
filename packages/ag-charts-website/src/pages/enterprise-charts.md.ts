import { landingPageMarkdownResponse } from '@utils/markdown-pages/landingPageMarkdownResponse';

// Served at /enterprise-charts.md — the markdown twin of the page, built from the same
// landing-pages/enterprise-charts.json the page renders. Content-negotiates from the HTML URL on
// Accept: text/markdown (see getMarkdownNegotiationRules in htaccessRules.ts).
export const GET = () => landingPageMarkdownResponse('enterprise-charts');
