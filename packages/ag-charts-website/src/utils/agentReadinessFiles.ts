/**
 * Builders for the agent-readiness files served at the charts site root: `/charts/llms.txt`
 * (the llms.txt convention) and `/charts/AGENTS.md` (a plain-language companion for AI coding
 * assistants).
 *
 * Both are generated from live inputs — the canonical base URL and the current major version —
 * so they regenerate on every build and cannot drift from the shipped product. The curated link
 * set is assembled from the same canonical base, so changing the host updates every link.
 */

interface AgentReadinessInput {
    /** Canonical charts site root with a trailing slash, e.g. `https://www.ag-grid.com/charts/`. */
    siteRoot: string;
    /** Current major version, e.g. `12`. */
    majorVersion: number;
    /**
     * Framework segment used for the docs links, e.g. `javascript`. JavaScript is the
     * framework-agnostic core, so it is the natural canonical entry point for an LLM-facing guide.
     */
    chartsDocsPrefix: string;
    /**
     * Whether per-page `.md` routes are generated. When false (the `DISABLE_MARKDOWN_DOCS` build
     * flag), the files must not advertise the `.md` convention or they would point agents at 404s.
     * Defaults to true.
     */
    includeMarkdownDocs?: boolean;
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
}

function buildLinks({ siteRoot, chartsDocsPrefix }: AgentReadinessInput): AgentReadinessLinks {
    const docs = `${siteRoot}${chartsDocsPrefix}/`;
    return {
        quickStart: `${docs}quick-start/`,
        options: `${docs}options/`,
        gallery: `${siteRoot}gallery/`,
        community: `${siteRoot}community/`,
        documentationArchive: `${siteRoot}documentation-archive/`,
        pricing: `${siteRoot}license-pricing/`,
        changelog: `${siteRoot}changelog/`,
        pipeline: `${siteRoot}pipeline/`,
        sitemap: `${siteRoot}sitemap-index.xml`,
        llmsTxt: `${siteRoot}llms.txt`,
    };
}

/**
 * Build the `/charts/llms.txt` body: an H1 with the product name, a one-line summary, then short
 * sections of markdown links to the key pages (the llms.txt format).
 */
export function buildLlmsTxt(input: AgentReadinessInput): string {
    const l = buildLinks(input);
    // Only advertise the `.md` convention when those routes are actually built.
    const markdownLine =
        input.includeMarkdownDocs === false
            ? ''
            : `\n- Markdown versions: append \`.md\` to any Charts docs page URL for a clean, framework-specific Markdown copy (e.g. ${l.quickStart.replace(/\/$/, '')}.md), or send \`Accept: text/markdown\`. The Gallery, Community, Documentation Archive and Pricing pages also have \`.md\` versions.`;
    return `# AG Charts
> High-performance JavaScript Charting library, framework-agnostic with React, Angular and Vue support. Free Community and paid Enterprise editions. Current major version: v${input.majorVersion}.

## Docs and tools
- [Quick start](${l.quickStart}): create your first chart
- [Options reference](${l.options}): complete chart options and API
- [Gallery](${l.gallery}): live, runnable chart examples${markdownLine}

## Optional
- [Community](${l.community}): showcase, events, media and tools & extensions
- [Pricing](${l.pricing}): Community (free) vs Enterprise
- [Changelog](${l.changelog}): features and fixes by version
- [Pipeline](${l.pipeline}): roadmap and backlog of upcoming features and fixes
- [Documentation Archive](${l.documentationArchive}): docs for previous versions
- [Sitemap](${l.sitemap}): full list of indexable pages
`;
}

/**
 * Build the `/charts/AGENTS.md` body: a plain-language companion for coding agents, covering what
 * AG Charts is, how to install it, and where to find current docs.
 */
export function buildAgentsMd(input: AgentReadinessInput): string {
    const l = buildLinks(input);
    // Advertise the markdown twins only when they are built (see includeMarkdownDocs).
    const markdownBullet =
        input.includeMarkdownDocs === false
            ? ''
            : `\n- **Markdown for LLMs:** append \`.md\` to any Charts docs page URL (e.g. ${l.quickStart.replace(/\/$/, '')}.md), or request the page with \`Accept: text/markdown\`. The [Gallery](${l.gallery}), [Community](${l.community}), [Documentation Archive](${l.documentationArchive}) and [Pricing](${l.pricing}) pages also have \`.md\` versions.`;
    return `# AG Charts - guide for AI coding assistants

- **What it is:** high-performance JavaScript Charting library. Framework-agnostic, with React, Angular and Vue wrappers. Community (free) and Enterprise (licensed) editions.
- **Current version:** v${input.majorVersion}. APIs can change across majors — check the version before generating code.
- **Install:** \`npm i ag-charts-community\` (or \`ag-charts-enterprise\`), plus the framework wrapper - \`ag-charts-react\`, \`ag-charts-angular\` or \`ag-charts-vue3\`. JavaScript needs no wrapper.
- **Where to look:** [quick start](${l.quickStart}), [options reference](${l.options}), [gallery](${l.gallery}) and the [changelog](${l.changelog}).
- **Common tasks:** "create a bar/line/pie chart", "configure axes", "add a legend", "theme a chart", "make a chart interactive" - each has a canonical example in the docs.${markdownBullet}

Machine-readable index: [llms.txt](${l.llmsTxt}).
`;
}
