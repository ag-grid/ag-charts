import { landingPageMarkdownResponse } from '@utils/markdown-pages/landingPageMarkdownResponse';

// Reached from the HTML URL via Accept: text/markdown (see getMarkdownNegotiationRules).
export const GET = () => landingPageMarkdownResponse('vue-charts');
