import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildThemeParametersApiMarkdown } from '@utils/markdown-pages/buildApiReferenceMarkdown';
import { getThemeParamRowGroups } from '@utils/server/getThemeParamRows';

export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildThemeParametersApiMarkdown({ groups: getThemeParamRowGroups(), siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
