import { landingPageMarkdownResponse } from '@utils/markdown-pages/landingPageMarkdownResponse';

// Content-negotiated from the HTML URL on Accept: text/markdown — see getMarkdownNegotiationRules in htaccessRules.ts.
export const GET = () => landingPageMarkdownResponse('angular-charts');
