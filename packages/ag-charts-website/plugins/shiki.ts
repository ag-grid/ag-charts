import shiki from '@astrojs/markdoc/shiki';
import type { Config, Node, RenderableTreeNode } from '@markdoc/markdoc';

import agDocsTheme from '../../../external/ag-website-shared/src/components/code/theme.json';

/**
 * Flatten transformed Markdoc nodes back into a plain string. Used to resolve any
 * interpolated variables/functions (e.g. `{% chartsVersionPatch() %}`) embedded in a code
 * fence before it is handed to the syntax highlighter.
 */
function renderToString(node: RenderableTreeNode | RenderableTreeNode[]): string {
    if (node == null) return '';
    if (Array.isArray(node)) return node.map(renderToString).join('');
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (typeof node === 'object' && 'children' in node) return renderToString(node.children);
    return '';
}

/**
 * Markdoc shiki highlighter using the shared AG Docs theme.
 *
 * Wraps the stock `@astrojs/markdoc/shiki` extension so that fences containing Markdoc
 * interpolation (`{% ... %}`) have their content resolved through Markdoc first. This lets
 * variables such as `{% chartsVersionPatch() %}` render their value inside code blocks — the
 * stock extension highlights the raw, un-interpolated content string.
 *
 * Preserves the `code` class on `<pre>` for legacy CSS compatibility.
 */
export default async function agShiki() {
    const extension = await shiki({
        theme: agDocsTheme as any,
        transformers: [
            {
                pre(node) {
                    this.addClassToHast(node, 'code');
                },
            },
        ],
    });

    const fence = extension.nodes!.fence;
    const baseTransform = fence.transform!.bind(fence);

    return {
        ...extension,
        nodes: {
            ...extension.nodes,
            fence: {
                ...fence,
                transform(node: Node, config: Config) {
                    const content: unknown = node.attributes?.content;
                    if (typeof content === 'string' && content.includes('{%')) {
                        node.attributes.content = renderToString(node.transformChildren(config));
                    }
                    return baseTransform(node, config);
                },
            },
        },
    };
}
