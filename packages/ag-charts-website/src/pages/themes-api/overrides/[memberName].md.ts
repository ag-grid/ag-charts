import type { PageTitle } from '@components/api-documentation/apiReferenceHelpers';
import { getThemesApiStaticPaths } from '@components/api-documentation/apiReferenceHelpers';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { THEMES_API_PAGE_CONTENT } from '@utils/markdown-pages/apiReferencePageContent';
import { buildThemesApiOverrideMarkdown } from '@utils/markdown-pages/buildApiReferenceMarkdown';
import { getInterfacesReference } from '@utils/server/getInterfacesReference';

// Mirrors the page's own getStaticPaths so the two URL sets line up 1:1.
// Content-negotiated from the HTML URL on Accept: text/markdown — see getMarkdownNegotiationRules in htaccessRules.ts.
export function getStaticPaths() {
    if (DISABLE_MARKDOWN_DOCS) {
        return [];
    }
    return getThemesApiStaticPaths(getInterfacesReference());
}

export function GET({
    props,
    params,
}: {
    props: { pageInterface: string; pageTitle: PageTitle };
    params: Record<string, string>;
}) {
    const { pageInterface, pageTitle } = props;

    const output = buildThemesApiOverrideMarkdown({
        reference: getInterfacesReference(),
        pageInterface,
        pageTitle,
        title: THEMES_API_PAGE_CONTENT.title,
        pageUrl: `/themes-api/overrides/${params.memberName}/`,
        siteRoot: SITE_URL,
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
