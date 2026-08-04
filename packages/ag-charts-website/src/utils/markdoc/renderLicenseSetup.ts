import { type MarkdownFramework, fencedCodeBlock } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { LICENSE_SETUP_COPY, LICENSE_SETUP_HEADINGS } from '@components/license-setup/licenseSetupContent';
import {
    getBootstrapSnippet,
    getDependenciesSnippet,
    getNpmInstallSnippet,
} from '@components/license-setup/utils/getSnippets';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';

// Placeholder the page shows until a key is pasted, so the snippet reads the same in both.
const LICENSE_PLACEHOLDER = 'your License Key';

// Fence language per framework, matching the languages the on-page Snippet component picks
// (see external/ag-website-shared/src/components/snippet/Snippet.tsx).
const FENCE_LANGUAGE: Record<MarkdownFramework, string> = {
    react: 'jsx',
    javascript: 'js',
    angular: 'ts',
    vue: 'ts',
};

/**
 * Build the `licenseSetup` tag as markdown. The tag renders an interactive licence-key tool,
 * but only the paste-a-key field and its validation messages need a browser: the headings,
 * prose and all three snippets are static once the key is a placeholder, so they are rendered
 * here from the same content module and snippet builders the page uses. Validating a real key
 * still needs the page, so that section links to it.
 */
export function buildLicenseSetupMarkdown({
    framework,
    siteRoot,
}: {
    framework: MarkdownFramework;
    siteRoot?: string;
}): string {
    const language = FENCE_LANGUAGE[framework];
    const snippetArgs = { library: 'charts', framework, isIntegratedCharts: false } as const;

    const pageUrl = toAbsoluteUrl(urlWithPrefix({ url: './license-install/', framework }), siteRoot);
    const { dependenciesLead, npmLead, olderVersionNote, bootstrapLead } = LICENSE_SETUP_COPY;
    const archiveUrl = toAbsoluteUrl(urlWithBaseUrl(olderVersionNote.link.url), siteRoot);

    const sections = [
        `## ${LICENSE_SETUP_HEADINGS.validate.text}`,
        `[Validate your licence key](${pageUrl}) using the tool on this page.`,
        `### ${LICENSE_SETUP_HEADINGS.dependencies.text}`,
        `${dependenciesLead.before} \`${dependenciesLead.code}\`${dependenciesLead.after}`,
    ];

    const dependenciesSnippet = getDependenciesSnippet(snippetArgs);
    if (dependenciesSnippet) {
        sections.push(fencedCodeBlock(dependenciesSnippet, language));
    }

    sections.push(
        note(`${olderVersionNote.before} [${olderVersionNote.link.text}](${archiveUrl}) ${olderVersionNote.after}`),
        npmLead
    );

    const npmInstallSnippet = getNpmInstallSnippet(snippetArgs);
    if (npmInstallSnippet) {
        sections.push(fencedCodeBlock(npmInstallSnippet, 'bash'));
    }

    sections.push(`### ${LICENSE_SETUP_HEADINGS.bootstrap.text}`, bootstrapLead);

    const { charts: bootstrapSnippet } = getBootstrapSnippet({
        framework,
        license: LICENSE_PLACEHOLDER,
        isIntegratedCharts: false,
    });
    if (bootstrapSnippet) {
        sections.push(fencedCodeBlock(bootstrapSnippet, language));
    }

    return sections.join('\n\n');
}

// Matches how the serializer renders an mdoc `{% note %}` block.
function note(text: string): string {
    return `> **Note**\n>\n> ${text}`;
}
