import { buildRoadmapMarkdown } from '@ag-website-shared/markdown-pages/buildRoadmapMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import roadmapData from '../../public/roadmap/roadmap.json';

// Content-negotiated from the HTML URL on Accept: text/markdown — see getMarkdownNegotiationRules in htaccessRules.ts.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildRoadmapMarkdown({
        roadmapData,
        productName: 'AG Charts',
        siteRoot: SITE_URL,
        // Item links are framework-relative, so pick a framework for the framework-agnostic twin.
        resolveUrl: (url) => urlWithPrefix({ framework: 'javascript', url }),
        // Stamped at build time so quarter labels are deterministic within a build.
        year: new Date().getFullYear(),
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
