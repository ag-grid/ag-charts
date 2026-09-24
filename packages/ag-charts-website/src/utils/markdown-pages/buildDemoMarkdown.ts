import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { DEMO_PAGE_CONTENT, DEMO_PAGE_HERO } from '@components/demo-examples/demoPageContent';
import type { DemoExampleId } from '@components/demo-examples/exampleRegistry';
import { DEMO_EXAMPLES, getDemoExample } from '@components/demo-examples/exampleRegistry';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import { buildChartsFrontmatter } from './chartsFrontmatter';

/**
 * Build the markdown twin of a showcase page. The showcase is an interactive demo with no text
 * representation, so the twin carries the page's hero copy and lists the sibling demos.
 */
export function buildDemoMarkdown({ demo, siteRoot }: { demo: DemoExampleId; siteRoot?: string }): string {
    const content = DEMO_PAGE_CONTENT[demo];
    const { primaryCta, secondaryCta } = DEMO_PAGE_HERO;
    // Registry paths are base-relative (`./examples/`); a twin's links are read outside the site,
    // so they are made absolute here.
    const demoUrl = (path: string) => toAbsoluteUrl(urlWithBaseUrl(path), siteRoot);
    const current = getDemoExample(demo);

    const document = [
        buildChartsFrontmatter({
            pageUrl: `${current.path.replace(/^\./, '')}/`,
            siteRoot,
            title: content.metaTitle,
            description: content.metaDescription,
        }),
        `# ${DEMO_PAGE_HERO.title}`,
        DEMO_PAGE_HERO.description,
        `This page runs an interactive AG Charts demo: ${current.description} ` +
            'It has no text version - open it in a browser to use it.',
        '## All demos',
        DEMO_EXAMPLES.map((example) => `- [${example.title}](${demoUrl(example.path)}): ${example.description}`).join(
            '\n'
        ),
        `[${primaryCta.label}](${toAbsoluteUrl(primaryCta.href, siteRoot)}) | ` +
            `[${secondaryCta.label}](${toAbsoluteUrl(secondaryCta.href, siteRoot)})`,
    ];

    return `${document.join('\n\n').trimEnd()}\n`;
}
