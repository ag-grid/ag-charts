import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import type { ApiReferenceType, PageTitle } from '@components/api-documentation/apiReferenceHelpers';
import { getOptionsStaticPaths, parseJsDocs } from '@components/api-documentation/apiReferenceHelpers';
import type { ApiReferenceTableLimits } from '@utils/markdoc/renderApiReferenceTable';
import { buildApiReferenceTable } from '@utils/markdoc/renderApiReferenceTable';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import { OPTIONS_API_PAGE_CONTENT, THEMES_API_PAGE_CONTENT, apiReferencePageHeading } from './apiReferencePageContent';

/**
 * `AgChartTheme.overrides` holds one entry per chart type, each repeating the whole chart options
 * tree, so a full expansion is combinatorial — ~97k rows and 15MB. Three levels reach every chart
 * type and the option groups it themes, which is the structure the page is actually about; the
 * properties inside those groups are documented under `/options/`.
 */
const THEMES_API_TABLE_LIMITS: ApiReferenceTableLimits = { maxDepth: 3, maxRows: 5000 };

interface ApiReferenceMarkdownParams {
    reference: ApiReferenceType;
    /** Interface the page documents; its members become the property table. */
    pageInterface: string;
    /** Page heading, mirroring the page's `<h1>`. */
    heading: string;
    title: string;
    description: string;
    /** Markdown blocks appended after the table — related pages, and any caveat about the table. */
    sections?: string[];
    tableLimits?: ApiReferenceTableLimits;
}

function frontmatter(title: string, description: string) {
    return ['---', `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(description)}`, '---'].join('\n');
}

/**
 * Build the markdown twin of an API reference page. The page renders its property tree client-side
 * from the generated interface reference, so the twin reads that same reference and flattens the
 * tree the reader would expand into dotted-path rows — the same table the docs pages' `apiReference`
 * tag produces, so the two surfaces describe a property identically.
 */
function buildApiReferenceMarkdown({
    reference,
    pageInterface,
    heading,
    title,
    description,
    sections = [],
    tableLimits,
}: ApiReferenceMarkdownParams): string {
    const interfaceRef = reference.get(pageInterface);
    const docs = interfaceRef?.kind === 'interface' ? parseJsDocs(interfaceRef.docs) : undefined;

    const document = [
        frontmatter(title, description),
        `# ${heading}`,
        docs,
        `Interface: \`${pageInterface}\``,
        buildApiReferenceTable(reference, { id: pageInterface }, tableLimits),
        ...sections,
    ];

    return `${document.filter(Boolean).join('\n\n').trimEnd()}\n`;
}

/** The `/options/` page, whose union variants each have a reference page of their own. */
export function buildOptionsApiMarkdown({
    reference,
    siteRoot,
}: {
    reference: ApiReferenceType;
    siteRoot?: string;
}): string {
    const variants = getOptionsStaticPaths(reference).map(({ params, props }) => {
        const href = toAbsoluteUrl(urlWithBaseUrl(`/options/${params.memberName}/${params.type}/`), siteRoot);
        return `- [${apiReferencePageHeading(props.pageTitle)}](${href})`;
    });

    return buildApiReferenceMarkdown({
        reference,
        pageInterface: 'AgChartOptions',
        heading: 'AgChartOptions',
        ...OPTIONS_API_PAGE_CONTENT,
        sections: variants.length
            ? [
                  '## Options with a reference page per type',
                  'Each of these properties is a union whose variants are documented separately.',
                  variants.join('\n'),
              ]
            : [],
    });
}

/** One union variant of the options reference, e.g. `series[type='bar']`. */
export function buildOptionsVariantMarkdown({
    reference,
    pageInterface,
    pageTitle,
    title,
    description,
    siteRoot,
}: {
    reference: ApiReferenceType;
    pageInterface: string;
    pageTitle: PageTitle;
    title: string;
    description: string;
    siteRoot?: string;
}): string {
    return buildApiReferenceMarkdown({
        reference,
        pageInterface,
        heading: apiReferencePageHeading(pageTitle),
        title,
        description,
        sections: [
            `Part of the [AG Charts Options API reference](${toAbsoluteUrl(urlWithBaseUrl('/options/'), siteRoot)}).`,
        ],
    });
}

/** The `/themes-api/` page. */
export function buildThemesApiMarkdown({
    reference,
    siteRoot,
}: {
    reference: ApiReferenceType;
    siteRoot?: string;
}): string {
    const optionsUrl = toAbsoluteUrl(urlWithBaseUrl('/options/'), siteRoot);
    return buildApiReferenceMarkdown({
        reference,
        pageInterface: 'AgChartTheme',
        heading: 'AgChartTheme',
        ...THEMES_API_PAGE_CONTENT,
        tableLimits: THEMES_API_TABLE_LIMITS,
        sections: [
            `Only the first three levels of \`overrides\` are listed: every chart type it accepts, and the option groups each one themes. Those groups take the themeable subset of the corresponding chart options — see the [Options API reference](${optionsUrl}).`,
        ],
    });
}

/** One `AgChartTheme.overrides` entry with a reference page of its own. */
export function buildThemesApiOverrideMarkdown({
    reference,
    pageInterface,
    pageTitle,
    title,
    siteRoot,
}: {
    reference: ApiReferenceType;
    pageInterface: string;
    pageTitle: PageTitle;
    title: string;
    siteRoot?: string;
}): string {
    return buildApiReferenceMarkdown({
        reference,
        pageInterface,
        heading: apiReferencePageHeading(pageTitle),
        title,
        description: THEMES_API_PAGE_CONTENT.description,
        sections: [
            `Part of the [AG Charts Themes API reference](${toAbsoluteUrl(urlWithBaseUrl('/themes-api/'), siteRoot)}).`,
        ],
    });
}
