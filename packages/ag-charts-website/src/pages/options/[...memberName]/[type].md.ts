import type { PageTitle } from '@components/api-documentation/apiReferenceHelpers';
import { getOptionsStaticPaths } from '@components/api-documentation/apiReferenceHelpers';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { optionsVariantPageContent } from '@utils/markdown-pages/apiReferencePageContent';
import { buildOptionsVariantMarkdown } from '@utils/markdown-pages/buildApiReferenceMarkdown';
import { getInterfacesReference } from '@utils/server/getInterfacesReference';

// Mirrors the page's own getStaticPaths so the two URL sets line up 1:1.
// Content-negotiated from the HTML URL on Accept: text/markdown — see getMarkdownNegotiationRules in htaccessRules.ts.
export function getStaticPaths() {
    if (DISABLE_MARKDOWN_DOCS) {
        return [];
    }
    return getOptionsStaticPaths(getInterfacesReference());
}

export function GET({
    props,
    params,
}: {
    props: { pageInterface: string; pageTitle: PageTitle };
    params: Record<string, string>;
}) {
    const { pageInterface, pageTitle } = props;

    const output = buildOptionsVariantMarkdown({
        reference: getInterfacesReference(),
        pageInterface,
        pageTitle,
        ...optionsVariantPageContent(pageTitle),
        pageUrl: `/options/${params.memberName}/${params.type}/`,
        siteRoot: SITE_URL,
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
