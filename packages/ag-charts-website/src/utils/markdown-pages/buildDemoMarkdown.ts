import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { DEMO_PAGE_CONTENT, DEMO_PAGE_HERO } from '@components/demo-examples/demoPageContent';
import type { DemoExampleId } from '@components/demo-examples/exampleRegistry';
import { DEMO_EXAMPLES } from '@components/demo-examples/exampleRegistry';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

/**
 * Build the markdown twin of a showcase page. The showcase is an interactive demo with no text
 * representation, so the twin carries the page's hero copy, lists the sibling demos, and says
 * plainly that the demo itself is a placeholder - an agent that reported these as working
 * examples would be wrong.
 */
export function buildDemoMarkdown({ demo, siteRoot }: { demo: DemoExampleId; siteRoot?: string }): string {
    const content = DEMO_PAGE_CONTENT[demo];
    const { primaryCta, secondaryCta } = DEMO_PAGE_HERO;
    // Registry paths are base-relative and unslashed (`./examples`); the site's URLs have a
    // trailing slash, and a twin's links are read outside the site that would redirect.
    const demoUrl = (path: string) => toAbsoluteUrl(urlWithBaseUrl(`${path.replace(/^\./, '')}/`), siteRoot);
    const current = DEMO_EXAMPLES.find((example) => example.id === demo);

    const document = [
        [
            '---',
            `title: ${JSON.stringify(content.metaTitle)}`,
            `description: ${JSON.stringify(content.metaDescription)}`,
            '---',
        ].join('\n'),
        `# ${DEMO_PAGE_HERO.title}`,
        DEMO_PAGE_HERO.description,
        `This page will host an interactive AG Charts demo${current ? `: ${current.description}` : '.'} ` +
            'The demo has not been built yet, so there is nothing to run here.',
        '## All demos',
        DEMO_EXAMPLES.map((example) => `- [${example.title}](${demoUrl(example.path)}): ${example.description}`).join(
            '\n'
        ),
        `[${primaryCta.label}](${toAbsoluteUrl(primaryCta.href, siteRoot)}) | ` +
            `[${secondaryCta.label}](${toAbsoluteUrl(secondaryCta.href, siteRoot)})`,
    ];

    return `${document.join('\n\n').trimEnd()}\n`;
}
