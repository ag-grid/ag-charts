import { buildRoadmapMarkdown } from '@ag-website-shared/markdown-pages/buildRoadmapMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import roadmapData from '../../public/roadmap/roadmap.json';

// Served at /roadmap.md — the markdown twin of the /roadmap page, built from the same roadmap.json
// the page renders. Content-negotiates from the HTML URL on Accept: text/markdown (see
// getMarkdownNegotiationRules in htaccessRules.ts).
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildRoadmapMarkdown({
        roadmapData,
        productName: 'AG Charts',
        siteRoot: SITE_URL,
        // Item links are framework-relative, resolved per-framework by RoadmapCard. The page is
        // framework-agnostic, so the twin picks the framework-agnostic core — matching the other
        // markdown twins (homepage, license-pricing).
        resolveUrl: (url) => urlWithPrefix({ framework: 'javascript', url }),
        // The page labels quarters with the current year; the build stamps it here so the generated
        // markdown is deterministic within a build.
        year: new Date().getFullYear(),
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
