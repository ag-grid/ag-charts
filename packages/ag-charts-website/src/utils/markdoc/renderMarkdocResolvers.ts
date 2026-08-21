import type { MarkdownFramework, MarkdownResolvers } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { getExamplesPath, getPageImages } from '@components/docs/utils/filesData';
import { getExampleUrl } from '@components/docs/utils/urlPaths';
import { getGeneratedContents } from '@components/example-generator';
import { stripOutExampleGeneratorCode } from '@components/example-runner/components/stripOutExampleGeneratorCode';
import { transform as transformSnippet } from '@components/snippet/snippetTransformer';
import { getInternalFramework } from '@utils/framework';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { renderMarkdocTag } from './renderMarkdocTag';

// Shiki-style language per framework, matching the on-page code viewer.
const FRAMEWORK_LANGUAGES: Record<MarkdownFramework, string> = {
    react: 'jsx',
    javascript: 'js',
    angular: 'ts',
    vue: 'ts',
};

function languageForFile(fileName: string): string {
    if (fileName.endsWith('.tsx')) {
        return 'tsx';
    }
    if (fileName.endsWith('.jsx')) {
        return 'jsx';
    }
    if (fileName.endsWith('.ts')) {
        return 'ts';
    }
    if (fileName.endsWith('.js')) {
        return 'js';
    }
    if (fileName.endsWith('.vue')) {
        return 'html';
    }
    return 'ts';
}

/**
 * Build the charts-specific resolver callbacks for the shared Markdoc-to-markdown
 * serializer. These hold all the Astro/filesystem/product coupling (example source,
 * API reference tables, partials, link/image URLs) so the shared serializer stays
 * product-agnostic.
 *
 * `siteRoot` (canonical origin, trailing slash) makes example/link/image URLs absolute
 * so the `.md` is portable when read out of context by an LLM.
 */
export function createChartsMarkdownResolvers({ siteRoot }: { siteRoot?: string } = {}): MarkdownResolvers {
    return {
        loadExampleSource: async ({ name, framework, pageName }) => {
            const internalFramework = getInternalFramework({ framework, useTypescript: true });
            try {
                const contents = await getGeneratedContents({
                    type: 'docs',
                    framework: internalFramework,
                    pageName,
                    exampleName: name,
                });
                if (!contents) {
                    return null;
                }
                const fileName = contents.entryFileName;
                if (!fileName || !contents.files?.[fileName]) {
                    return null;
                }
                // Strip the generator-injected harness so the source matches the on-page viewer.
                const files = { ...contents.files };
                stripOutExampleGeneratorCode(files);
                const cleanCode = files[fileName].trim();
                const liveUrl = toAbsoluteUrl(
                    getExampleUrl({ internalFramework, pageName, exampleName: name }),
                    siteRoot
                );
                return {
                    code: cleanCode,
                    language: languageForFile(fileName),
                    liveUrl,
                };
            } catch {
                return null;
            }
        },

        renderTag: ({ tag, attributes, framework, pageName }) =>
            renderMarkdocTag({ tag, attributes, framework, pageName, siteRoot }),

        readPartial: ({ file, pageName }) => {
            try {
                // Partials live alongside the examples, one level up from the `_examples` dir.
                const pageDir = path.dirname(getExamplesPath({ pageName }));
                return readFileSync(path.join(pageDir, file)).toString();
            } catch {
                return null;
            }
        },

        transformFence: ({ code, framework, language }) => {
            try {
                const transformed = transformSnippet(code, framework, {});
                return { code: transformed, language: FRAMEWORK_LANGUAGES[framework] };
            } catch {
                // The snippet transformer only handles options-shaped snippets; fall back to raw.
                return { code, language: language || FRAMEWORK_LANGUAGES[framework] };
            }
        },

        resolveLinkHref: ({ href, framework }) => {
            try {
                return toAbsoluteUrl(urlWithPrefix({ url: href, framework }), siteRoot);
            } catch {
                return href;
            }
        },

        resolveImageSrc: async ({ imagePath, pageName }) => {
            try {
                // Must go through Astro's asset pipeline; a naive /docs/<page>/<path> URL 404s.
                const { imageSrc } = await getPageImages({ pageName, imagePath });
                return imageSrc ? toAbsoluteUrl(imageSrc, siteRoot) : imagePath;
            } catch {
                return imagePath;
            }
        },
    };
}
