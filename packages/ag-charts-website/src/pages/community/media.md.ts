import { buildCommunityMediaMarkdown } from '@ag-website-shared/markdown-pages/community/buildCommunityMediaMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { chartsSiteFrontmatter } from '@utils/markdown-pages/chartsFrontmatter';

// Served at /community/media.md — a markdown twin of the /community/media page for LLMs, built
// from the same videos/podcasts/blogs JSON the page renders.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    return new Response(
        buildCommunityMediaMarkdown({
            product: 'AG Charts',
            currentSite: 'charts',
            siteRoot: SITE_URL,
            siteFrontmatter: chartsSiteFrontmatter({ pageUrl: '/community/media/', siteRoot: SITE_URL }),
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
            },
        }
    );
}
