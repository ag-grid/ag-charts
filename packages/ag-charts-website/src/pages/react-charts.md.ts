import { landingPageMarkdownResponse } from '@utils/markdown-pages/landingPageMarkdownResponse';

// Served at /react-charts.md — the markdown twin of the page, built from the same
// landing-pages/react-charts.json the page renders. Content-negotiates from the HTML URL on
// Accept: text/markdown (see getMarkdownNegotiationRules in htaccessRules.ts).
export const GET = () => landingPageMarkdownResponse('react-charts');
