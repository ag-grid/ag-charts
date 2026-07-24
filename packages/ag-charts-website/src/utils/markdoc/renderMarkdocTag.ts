import type { Library } from '@ag-grid-types';
import featuresData from '@ag-website-shared/components/features-section/DocsFeaturesSection.json';
import { FEATURE_MAP } from '@ag-website-shared/components/getting-started/gettingStartedData';
import whatsNewData from '@ag-website-shared/content/whats-new/data.json';
import { type MarkdownFramework, fencedCodeBlock } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { getDocumentationArchiveUrl } from '@ag-website-shared/utils/getArchiveUrl';
import { getChangelogUrl } from '@ag-website-shared/utils/getChangelogUrl';
import { parseVersion } from '@ag-website-shared/utils/parseVersion';
import { getExamplesPath } from '@components/docs/utils/filesData';
import { agLibraryVersion } from '@constants';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import { getEntry } from 'astro:content';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { renderApiReferenceTable } from './renderApiReferenceTable';
import { type VersionEntry, buildMajorTable } from './renderMajorTable';
import { type ModuleNode, buildModuleMappingsTable } from './renderModuleMappings';

interface RenderMarkdocTagParams {
    tag: string;
    attributes: Record<string, any>;
    framework: MarkdownFramework;
    pageName: string;
    siteRoot?: string;
}

/**
 * Charts dispatch for the Markdoc tags the shared serializer delegates via its
 * `renderTag` resolver — the content-bearing tags with no built-in handler.
 * Returns `null` for anything unknown so the serializer falls back to rendering
 * the tag's children. Never throws: a failed tag degrades to '' with a warning,
 * matching renderApiReferenceTable.
 */
export async function renderMarkdocTag(params: RenderMarkdocTagParams): Promise<string | null> {
    const { tag, attributes, framework, pageName, siteRoot } = params;
    try {
        switch (tag) {
            case 'apiReference':
                return await renderApiReferenceTable({ attributes, framework });
            case 'moduleMappings':
                return await renderModuleMappings(framework, siteRoot);
            case 'majorTable':
                return await renderMajorTable(attributes, framework, siteRoot);
            case 'embedSnippet':
                return renderEmbedSnippet(attributes, pageName, siteRoot);
            case 'changelogSection':
                return renderChangelogSection(attributes);
            case 'documentationArchiveSection':
                return renderDocumentationArchiveSection(attributes);
            case 'featuresSection':
                return renderFeaturesSection(attributes, framework, siteRoot);
            case 'gettingStarted':
                return renderGettingStarted(attributes, framework, siteRoot);
            case 'licenseSetup':
                return renderLicenseSetup(framework, siteRoot);
            case 'trialLicenceForm':
                return renderTrialLicenceForm(siteRoot);
            default:
                return null;
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`renderMarkdocTag: failed to render <${tag}> — ${(error as Error)?.message ?? error}`);
        return '';
    }
}

async function renderModuleMappings(framework: MarkdownFramework, siteRoot?: string): Promise<string> {
    const entry = await getEntry('moduleMappings', 'modules');
    if (!entry) {
        return '';
    }
    const groups = (entry.data as { groups: ModuleNode[] }).groups ?? [];
    return buildModuleMappingsTable(groups, framework, siteRoot);
}

async function renderMajorTable(
    attributes: Record<string, any>,
    framework: MarkdownFramework,
    siteRoot?: string
): Promise<string> {
    const library = attributes.library ?? 'charts';
    const entry = await getEntry('versions', `ag-${library}-versions`);
    if (!entry) {
        return '';
    }
    return buildMajorTable(entry.data as VersionEntry[], attributes, framework, siteRoot);
}

function renderEmbedSnippet(attributes: Record<string, any>, pageName: string, siteRoot?: string): string {
    // The on-disk `src` branch is inlined at build time; the `url` branch points to a served file
    // the HTML page fetches client-side, so link to its absolute URL rather than fetch-and-inline.
    if (attributes.src) {
        const examplePath = getExamplesPath({ pageName });
        const file = path.join(examplePath, String(attributes.src));
        const code = readFileSync(file).toString().replace(/\n$/, '');
        const language = attributes.language ? String(attributes.language) : '';
        return fencedCodeBlock(code, language);
    }
    if (attributes.url) {
        const href = toAbsoluteUrl(urlWithBaseUrl(String(attributes.url)), siteRoot);
        const name = String(attributes.url).split('/').filter(Boolean).pop() ?? 'snippet';
        return `[View snippet source: \`${name}\`](${href})`;
    }
    return '';
}

function renderChangelogSection(attributes: Record<string, any>): string {
    const version = String(attributes.version ?? '');
    const site = (attributes.site ?? 'charts') as Library;
    if (!version) {
        return '';
    }
    const url = getChangelogUrl({ site, version });
    return `## Changes List\n\n[See the full changelog for v${version}](${url})`;
}

function renderDocumentationArchiveSection(attributes: Record<string, any>): string {
    const version = String(attributes.version ?? '');
    const site = (attributes.site ?? 'charts') as Library;
    if (!version) {
        return '';
    }
    const { major, minor } = parseVersion(version);
    const current = parseVersion(agLibraryVersion);
    // Matches DocumentationArchiveSection.astro: nothing to show for the current major/minor.
    if (major === current.major && minor === current.minor) {
        return '';
    }
    const name = (whatsNewData as Record<string, { name: string }>)[site]?.name ?? 'AG Charts';
    const url = getDocumentationArchiveUrl({ site, version });
    return `## Documentation\n\n[See ${name} ${major}.${minor} Documentation](${url})`;
}

interface FeatureItem {
    title: string;
    description: string;
    link?: string;
}

function renderFeaturesSection(
    attributes: Record<string, any>,
    framework: MarkdownFramework,
    siteRoot?: string
): string {
    const library = String(attributes.library ?? 'charts');
    const type = String(attributes.type ?? '');
    const features: FeatureItem[] =
        (featuresData as Record<string, Record<string, FeatureItem[]>>)[library]?.[type] ?? [];
    if (features.length === 0) {
        return '';
    }
    return features
        .map((feature) => {
            const title = feature.link
                ? `[${feature.title}](${toAbsoluteUrl(urlWithPrefix({ url: feature.link, framework }), siteRoot)})`
                : feature.title;
            return `- **${title}** — ${feature.description}`;
        })
        .join('\n');
}

function renderGettingStarted(
    attributes: Record<string, any>,
    framework: MarkdownFramework,
    siteRoot?: string
): string {
    const library = (attributes.library ?? 'charts') as Library;
    const features = FEATURE_MAP[library] ?? [];
    if (features.length === 0) {
        return '';
    }
    return features
        .map((feature) => {
            const url = toAbsoluteUrl(urlWithPrefix({ url: feature.link, framework }), siteRoot);
            return `- [${feature.title}](${url}) — ${feature.description}`;
        })
        .join('\n');
}

// Interactive licence-key setup tool; link to the page that hosts it instead.
function renderLicenseSetup(framework: MarkdownFramework, siteRoot?: string): string {
    const url = toAbsoluteUrl(urlWithPrefix({ url: './license-install/', framework }), siteRoot);
    return `[Set up your licence key](${url})`;
}

// Interactive trial-licence request form; link to the licensing page instead.
function renderTrialLicenceForm(siteRoot?: string): string {
    const url = toAbsoluteUrl(urlWithBaseUrl('/license-pricing/'), siteRoot);
    return `[Request a 30-day Enterprise Bundle trial licence](${url})`;
}
