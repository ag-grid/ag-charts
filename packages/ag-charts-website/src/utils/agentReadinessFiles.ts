/**
 * Builders for the agent-readiness files served at the charts site root: `/charts/llms.txt`
 * (the llms.txt convention) and `/charts/AGENTS.md` (a plain-language companion for AI coding
 * assistants).
 *
 * Both are generated from live inputs — the canonical base URL and the current major version —
 * so they regenerate on every build and cannot drift from the shipped product. The curated link
 * set is assembled from the same canonical base, so changing the host updates every link.
 */

/** A named group of links in the `llms.txt` page index, e.g. `Series > Bar Series`. */
export interface LlmsTxtSection {
    title: string;
    links: Array<{ title: string; url: string }>;
}

interface AgentReadinessInput {
    /** Canonical charts site root with a trailing slash, e.g. `https://www.ag-grid.com/charts/`. */
    siteRoot: string;
    /** Current major version, e.g. `12`. */
    majorVersion: number;
    /**
     * Framework segment used for the curated docs links, e.g. `react`. This is the site's default
     * framework, the one the header's Docs and API links point at, so agents and crawlers are sent
     * to the same entry point as people (SE-206).
     */
    chartsDocsPrefix: string;
    /**
     * Whether per-page `.md` routes are generated. When false (the `DISABLE_MARKDOWN_DOCS` build
     * flag), the files must not advertise the `.md` convention or they would point agents at 404s.
     * Defaults to true.
     */
    includeMarkdownDocs?: boolean;
    /**
     * The complete page index published below the curated sections: the docs nav flattened into
     * its groups, then everything else grouped as the sitemap groups it. Optional, so the
     * curated head of the file still builds without a nav or a sitemap to hand.
     */
    docsIndex?: LlmsTxtSection[];
    siteIndex?: LlmsTxtSection[];
    /**
     * Framework segment of the `docsIndex` URLs, e.g. `javascript`. The index publishes the
     * framework-agnostic JavaScript docs once rather than all four frameworks. Defaults to
     * `chartsDocsPrefix`.
     */
    indexDocsPrefix?: string;
}

interface AgentReadinessLinks {
    quickStart: string;
    options: string;
    gallery: string;
    community: string;
    documentationArchive: string;
    pricing: string;
    changelog: string;
    pipeline: string;
    sitemap: string;
    llmsTxt: string;
    /** The homepage twin, which is `index.md` rather than a `.md` suffix on the site root. */
    homepageMarkdown: string;
}

const FRAMEWORKS = ['javascript', 'react', 'angular', 'vue'];

function buildLinks({ siteRoot, chartsDocsPrefix }: AgentReadinessInput): AgentReadinessLinks {
    const docs = `${siteRoot}${chartsDocsPrefix}/`;
    return {
        quickStart: `${docs}quick-start/`,
        // The options reference is framework-agnostic: it has no per-framework docs page.
        options: `${siteRoot}options/`,
        gallery: `${siteRoot}gallery/`,
        community: `${siteRoot}community/`,
        documentationArchive: `${siteRoot}documentation-archive/`,
        pricing: `${siteRoot}license-pricing/`,
        changelog: `${siteRoot}changelog/`,
        pipeline: `${siteRoot}pipeline/`,
        sitemap: `${siteRoot}sitemap-index.xml`,
        llmsTxt: `${siteRoot}llms.txt`,
        homepageMarkdown: `${siteRoot}index.md`,
    };
}

/** The instruction for reaching another framework's copy of a docs URL, by swapping its framework segment. */
function frameworkSubstitution(docsPrefix: string): string {
    const [framework] = docsPrefix.split('-');
    const others = FRAMEWORKS.filter((f) => f !== framework).map((f) => `\`${f}\``);
    const otherList = `${others.slice(0, -1).join(', ')} or ${others[others.length - 1]}`;
    return `replace \`${docsPrefix}\` with \`${docsPrefix.replace(/^[a-z]+/, '<framework>')}\` (${otherList})`;
}

/**
 * Build the `/charts/llms.txt` body: an H1 with the product name, a one-line summary, then short
 * sections of markdown links to the key pages (the llms.txt format).
 */
/** Render one index group as an `###` heading over its links, or nothing when it is empty. */
function renderIndexSection({ title, links }: LlmsTxtSection): string {
    if (!links.length) {
        return '';
    }
    return [`### ${title}`, ...links.map((link) => `- [${link.title}](${link.url})`)].join('\n');
}

function renderIndex(sections: LlmsTxtSection[] = []): string {
    return sections.map(renderIndexSection).filter(Boolean).join('\n\n');
}

export function buildLlmsTxt(input: AgentReadinessInput): string {
    const l = buildLinks(input);
    const docsIndex = renderIndex(input.docsIndex);
    const siteIndex = renderIndex(input.siteIndex);
    // The docs exist once per framework, so listing all four would quadruple the file for no new
    // information. Publish the framework-agnostic JavaScript URL and state the substitution.
    const indexDocsPrefix = input.indexDocsPrefix ?? input.chartsDocsPrefix;
    const docsIndexSection = docsIndex
        ? [
              '',
              '## Documentation',
              'Every documentation page, in navigation order. Each URL is the framework-agnostic' +
                  ` JavaScript one; ${frameworkSubstitution(indexDocsPrefix)} for the framework-specific page.`,
              '',
              `${docsIndex}\n`,
          ].join('\n')
        : '';
    const siteIndexSection = siteIndex ? ['', '## Site pages', '', `${siteIndex}\n`].join('\n') : '';
    // State the `.md` rule rather than enumerate pages, which would drift out of date.
    const markdownLine =
        input.includeMarkdownDocs === false
            ? ''
            : `\n- Markdown versions: append \`.md\` to any page URL listed in the sitemap for a clean Markdown copy (e.g. ${l.quickStart.replace(/\/$/, '')}.md), or send \`Accept: text/markdown\`. Docs pages are resolved for the framework in the URL. The homepage is the one URL with no \`.md\` suffix - its copy is ${l.homepageMarkdown}.`;
    return `# AG Charts
> High-performance JavaScript Charting library, framework-agnostic with React, Angular and Vue support. Free Community and paid Enterprise editions. Current major version: v${input.majorVersion}.

## Docs and tools
- [Quick start](${l.quickStart}): create your first chart
- [Options reference](${l.options}): complete chart options and API
- [Gallery](${l.gallery}): live, runnable chart examples
- Frameworks: the framework-specific docs links above are for the site's default framework; ${frameworkSubstitution(input.chartsDocsPrefix)} for another framework's page.${markdownLine}

## Optional
- [Community](${l.community}): showcase, events, media and tools & extensions
- [Pricing](${l.pricing}): Community (free) vs Enterprise
- [Changelog](${l.changelog}): features and fixes by version
- [Pipeline](${l.pipeline}): roadmap and backlog of upcoming features and fixes
- [Documentation Archive](${l.documentationArchive}): docs for previous versions
- [Sitemap](${l.sitemap}): full list of indexable pages
${docsIndexSection}${siteIndexSection}`;
}

/**
 * Build the `/charts/AGENTS.md` body: a plain-language companion for coding agents, covering what
 * AG Charts is, how to install it, and where to find current docs.
 */
export function buildAgentsMd(input: AgentReadinessInput): string {
    const l = buildLinks(input);
    // State the `.md` rule rather than enumerate pages, which would drift out of date.
    const markdownBullet =
        input.includeMarkdownDocs === false
            ? ''
            : `\n- **Markdown for LLMs:** append \`.md\` to any page URL listed in the [sitemap](${l.sitemap}) (e.g. ${l.quickStart.replace(/\/$/, '')}.md), or request the page with \`Accept: text/markdown\`. Docs pages are resolved for the framework in the URL. The homepage is the one URL with no \`.md\` suffix - its copy is ${l.homepageMarkdown}.`;
    return `# AG Charts - guide for AI coding assistants

- **What it is:** high-performance JavaScript Charting library. Framework-agnostic, with React, Angular and Vue wrappers. Community (free) and Enterprise (licensed) editions.
- **Current version:** v${input.majorVersion}. APIs can change across majors — check the version before generating code.
- **Install:** \`npm i ag-charts-community\` (or \`ag-charts-enterprise\`), plus the framework wrapper - \`ag-charts-react\`, \`ag-charts-angular\` or \`ag-charts-vue3\`. JavaScript needs no wrapper.
- **Where to look:** [quick start](${l.quickStart}), [options reference](${l.options}), [gallery](${l.gallery}) and the [changelog](${l.changelog}).
- **Frameworks:** the framework-specific docs links here are for the site's default framework; ${frameworkSubstitution(input.chartsDocsPrefix)} for another framework's page.
- **Common tasks:** "create a bar/line/pie chart", "configure axes", "add a legend", "theme a chart", "make a chart interactive" - each has a canonical example in the docs.${markdownBullet}

Machine-readable index: [llms.txt](${l.llmsTxt}).
`;
}
