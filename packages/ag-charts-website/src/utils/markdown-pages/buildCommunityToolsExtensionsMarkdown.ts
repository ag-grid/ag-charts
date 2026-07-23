import { allTools, renderTools } from './communityContent';

/**
 * Build the markdown twin of /community/tools-extensions: the ecosystem of community-built tools,
 * extensions and utilities. Reads the same tools-extensions.json the page renders.
 */
export function buildCommunityToolsExtensionsMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const frontmatter = [
        '---',
        'title: "AG Charts: Tools & Extensions"',
        'description: "Browse our ecosystem of community-built tools, extensions and utils to help you create your next project, no matter which language or framework you\'re using."',
        '---',
    ].join('\n');

    const document = [
        frontmatter,
        '# An Ecosystem of Tools and Libraries',
        "Browse our ecosystem of community-built tools, extensions and utils to help you create your next project, no matter which language or framework you're using.",
        renderTools(allTools(), siteRoot),
    ].join('\n\n');

    return `${document.trimEnd()}\n`;
}
