import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildGalleryMarkdown } from '@utils/markdown-pages/buildGalleryMarkdown';

// Served at /gallery.md — a markdown twin of the /gallery/ page for LLMs. The page is a grid
// of interactive chart thumbnails, so the twin is an index of every gallery example grouped
// by chart type, sharing its data with the page (the gallery collection). Generated at build
// time so it cannot drift.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildGalleryMarkdown({ siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
