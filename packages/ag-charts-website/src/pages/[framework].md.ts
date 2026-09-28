import { DISABLE_MARKDOWN_DOCS, FRAMEWORK_LANDING_HUBS } from '@constants';
import { landingPageMarkdownResponse } from '@utils/markdown-pages/landingPageMarkdownResponse';

export function getStaticPaths() {
    if (DISABLE_MARKDOWN_DOCS) {
        return [];
    }
    return FRAMEWORK_LANDING_HUBS.map((framework) => ({ params: { framework } }));
}

// Content-negotiated from the HTML URL on Accept: text/markdown - see getMarkdownNegotiationRules.
export const GET = ({ params }: { params: Record<string, string> }) =>
    landingPageMarkdownResponse(`${params.framework}-charts`, `/${params.framework}/`);
