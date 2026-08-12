import type { Plugin } from 'vite';

import agDevMarkdownNegotiation from '../../../external/ag-website-shared/plugins/agDevMarkdownNegotiation';
import { DISABLE_MARKDOWN_DOCS, SITE_BASE_URL } from '../src/constants';
import { markdownPathPatterns } from '../src/utils/markdownPages';

// Content-negotiate charts pages to their markdown variant in the dev server. Charts supplies its
// URL shapes and base; the shared factory holds the mechanism (see
// external/ag-website-shared/plugins/agDevMarkdownNegotiation for the full rationale). The page
// list comes from CHARTS_MARKDOWN_PAGE_GROUPS, the same registry the production htaccess rules
// derive from, so dev and prod cannot disagree about what is negotiable.
//
// Charts is served under a base (`/charts`), so the homepage request is `/charts/`; the shared
// factory maps that base root to `<base>/index.md`.
export default function agDevChartsMarkdownNegotiation(): Plugin {
    return agDevMarkdownNegotiation({
        pathPatterns: markdownPathPatterns(),
        disabled: DISABLE_MARKDOWN_DOCS,
        basePath: (SITE_BASE_URL ?? '').replace(/\/$/, ''),
    });
}
