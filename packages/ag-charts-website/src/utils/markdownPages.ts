// Type-only import: erased at runtime, so this module stays loadable under plain node (the
// htaccess test harness runs it through `tsx`, where the shared subrepo resolves as CJS).
import type { MarkdownPageGroup } from '../../../../external/ag-website-shared/src/markdown-pages/markdownPageRegistry';
import { FRAMEWORKS, SITE_BASE_URL } from '../constants';

/**
 * Every AG Charts page that ships a markdown (`.md`) twin, declared once.
 *
 * Derives the dev-server negotiation patterns, the Apache rewrite rule and the Apache
 * `Vary: Accept` scope — see `@ag-website-shared/markdown-pages/markdownPageRegistry` for the
 * pattern-syntax constraints (the patterns are compiled by both JavaScript and PCRE).
 *
 * The invariant this list serves: **every URL in the sitemap has a `.md` twin**. It is enforced
 * by the post-build check in `markdownPages.test.ts`, so a new page added without a twin fails
 * rather than silently 404ing for agents. Pages excluded from the sitemap (example runners,
 * `debug/*`, redirect stubs, the contact result pages) are correspondingly absent here.
 *
 * Imported by the dev-server Vite plugin, which is bundled with `astro.config.mjs` and so
 * resolves without tsconfig path aliases — hence the relative import above.
 */
export const CHARTS_MARKDOWN_PAGE_GROUPS: MarkdownPageGroup[] = [
    {
        describes: 'The homepage. Negotiated by a dedicated rule: its twin is index.md, not <path>.md.',
    },
    {
        describes: 'Every docs page, once per framework — the bulk of the twins.',
        pattern: `(?:${FRAMEWORKS.join('|')})/[^/.]+`,
    },
    {
        describes: 'Top-level content pages.',
        pattern: 'changelog|contact|documentation-archive|license-pricing|pipeline|roadmap|sitemap|whats-new',
    },
    {
        describes: 'The community landing page and its subpages.',
        pattern: 'community(?:/(?:beyond-the-prompt|events|media|showcase|tools-extensions))?',
    },
    {
        describes: 'Beyond the Prompt conference session recordings.',
        pattern: 'session/[^/.]+',
    },
    {
        describes: 'The gallery landing page and every gallery example.',
        pattern: 'gallery(?:/[^/.]+)?',
    },
    {
        describes: 'SEO landing pages, all rendered from the landingPages collection.',
        pattern: '(?:angular|enterprise|javascript|react|vue)-charts',
    },
    {
        // The member paths mirror the ones getOptionsStaticPaths fans out over; a fifth added there
        // without a pattern here fails the coverage check rather than silently losing negotiation.
        describes: 'The Options API reference and the union variants with a page of their own.',
        pattern: 'options(?:/(?:axes|series|initialState/annotations|navigator/miniChart/series)/[^/.]+)?',
    },
    {
        describes: 'The Themes API reference and its per-override pages.',
        pattern: 'themes-api(?:/overrides/[^/.]+)?',
    },
];

function patternedGroups(): string[] {
    return CHARTS_MARKDOWN_PAGE_GROUPS.map((group) => group.pattern).filter(
        (pattern): pattern is string => pattern != null && pattern.length > 0
    );
}

/**
 * Alternation fragment for embedding in an anchored Apache regex, e.g. `^/(<alternation>)/?$`.
 * Base-free: charts is served under `SITE_BASE_URL`, and the htaccess rules splice that in
 * themselves because the rewrite has to capture it (see `getMarkdownNegotiationRules`).
 */
export function markdownPathAlternation(): string {
    return patternedGroups().join('|');
}

/**
 * Anchored JavaScript regexes, one per group, for the dev-server negotiation plugin and the
 * coverage check. Matched against a full request pathname, which carries the base, so the base
 * is anchored in. A trailing slash is optional so both `/charts/gallery` and `/charts/gallery/`
 * negotiate.
 */
export function markdownPathPatterns(): RegExp[] {
    const basePath = (SITE_BASE_URL ?? '').replace(/\/$/, '');
    return patternedGroups().map((pattern) => new RegExp(`^${basePath}/(?:${pattern})/?$`));
}
