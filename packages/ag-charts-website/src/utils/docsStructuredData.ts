import type { Framework } from '@ag-grid-types';
import {
    type BreadcrumbItem,
    type JsonLdObject,
    buildBreadcrumbList,
    buildDocsTopic,
    buildTechArticle,
    getDocsTopicId,
    getSoftwareApplicationId,
    siteRootUrl,
} from '@ag-website-shared/utils/structuredData';
import { DOCS_FRAMEWORK_REDIRECT_PAGE } from '@components/docs/constants';
import { FRAMEWORKS, isFrameworkLandingHub } from '@constants';
import { getFrameworkDisplayText } from '@utils/framework';

const FRAMEWORK_PACKAGES: Record<Framework, string> = {
    javascript: 'ag-charts-community',
    react: 'ag-charts-react',
    angular: 'ag-charts-angular',
    vue: 'ag-charts-vue3',
};

export function getDocsPageUrl({
    canonicalUrlBase,
    framework,
    pageName,
}: {
    canonicalUrlBase: string;
    framework: Framework;
    pageName: string;
}): string {
    return `${siteRootUrl(canonicalUrlBase)}${framework}/${pageName}/`;
}

interface DocsPageStructuredDataInput {
    canonicalUrlBase: string;
    framework: Framework;
    pageName: string;
    title: string;
    description: string;
    isEnterprise?: boolean;
}

/**
 * Page-level structured data for a framework docs page: the `TechArticle`, the topic node
 * shared by every framework variant of the page, and a `BreadcrumbList`. The page's
 * examples add their own `SoftwareSourceCode` nodes (see `DocsExampleRunner.astro`).
 */
export function buildDocsPageStructuredData({
    canonicalUrlBase,
    framework,
    pageName,
    title,
    description,
    isEnterprise,
}: DocsPageStructuredDataInput): JsonLdObject[] {
    const pageUrl = getDocsPageUrl({ canonicalUrlBase, framework, pageName });
    const frameworkDisplayText = getFrameworkDisplayText(framework);

    return [
        buildTechArticle({
            canonicalUrlBase,
            pageUrl,
            title,
            description,
            aboutEntityId: getSoftwareApplicationId(canonicalUrlBase),
            topicId: getDocsTopicId(canonicalUrlBase, pageName),
            keywords: [frameworkDisplayText, `${frameworkDisplayText} Charts`, 'AG Charts', title],
            dependencies: [FRAMEWORK_PACKAGES[framework], ...(isEnterprise ? ['ag-charts-enterprise'] : [])],
        }),
        // `getDocsPages` generates every docs page for every framework, so each topic lists all of them.
        buildDocsTopic({
            canonicalUrlBase,
            pageName,
            name: title,
            variantPageUrls: FRAMEWORKS.map((variant) =>
                getDocsPageUrl({ canonicalUrlBase, framework: variant, pageName })
            ),
        }),
        buildBreadcrumbList({
            pageUrl,
            items: getBreadcrumbItems({ canonicalUrlBase, framework, title, pageUrl }),
        }),
    ];
}

/**
 * Site root, then the framework's docs root, then the page. A framework without a landing hub
 * redirects its root to `DOCS_FRAMEWORK_REDIRECT_PAGE`, so the crumb points at that page
 * instead, and is dropped on that page itself rather than repeating it.
 */
function getBreadcrumbItems({
    canonicalUrlBase,
    framework,
    title,
    pageUrl,
}: {
    canonicalUrlBase: string;
    framework: Framework;
    title: string;
    pageUrl: string;
}): BreadcrumbItem[] {
    const siteRoot = siteRootUrl(canonicalUrlBase);
    const frameworkRootUrl = isFrameworkLandingHub(framework)
        ? `${siteRoot}${framework}/`
        : getDocsPageUrl({ canonicalUrlBase, framework, pageName: DOCS_FRAMEWORK_REDIRECT_PAGE });
    const frameworkItems =
        frameworkRootUrl === pageUrl
            ? []
            : [{ name: `${getFrameworkDisplayText(framework)} Charts`, url: frameworkRootUrl }];

    return [{ name: 'AG Charts', url: siteRoot }, ...frameworkItems, { name: title, url: pageUrl }];
}
