import type { Plugin } from 'vite';

import agDevMarkdownNegotiation from '../../../external/ag-website-shared/plugins/agDevMarkdownNegotiation';
import { DISABLE_MARKDOWN_DOCS, FRAMEWORKS } from '../src/constants';

// A single docs page path, e.g. `/charts/react/axes`. The framework segment is matched
// wherever it appears so the rule holds regardless of the configured base (`/charts`).
// The final segment excludes dots so the `.md` variant itself never matches (no rewrite
// loop) and the framework landing page (`/charts/react/`, which has no `.md`) is left alone.
const DOCS_PAGE_PATH = new RegExp(`/(?:${FRAMEWORKS.join('|')})/[^/.]+/?$`);

// Top-level (non-docs) pages that also ship a `.md` twin. Kept in sync with the same page
// list in the htaccess negotiation rule (see htaccessRules.ts).
const TOP_LEVEL_MD_PATH = /\/(?:license-pricing|documentation-archive|gallery)\/?$/;

// The /community landing page and its subpages, each with a `.md` twin.
const COMMUNITY_MD_PATH = /\/community(?:\/(?:events|showcase|tools-extensions|media|beyond-the-prompt))?\/?$/;

// Content-negotiate charts docs pages to their markdown variant in the dev server. Charts
// supplies its URL shapes; the shared factory holds the mechanism (see
// external/ag-website-shared/plugins/agDevMarkdownNegotiation for the full rationale).
export default function agDevChartsMarkdownNegotiation(): Plugin {
    return agDevMarkdownNegotiation({
        pathPatterns: [DOCS_PAGE_PATH, TOP_LEVEL_MD_PATH, COMMUNITY_MD_PATH],
        disabled: DISABLE_MARKDOWN_DOCS,
    });
}
