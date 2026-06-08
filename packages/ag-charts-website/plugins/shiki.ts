import shiki from '@astrojs/markdoc/shiki';

import agDocsTheme from '../../../external/ag-website-shared/src/components/code/theme.json';

/**
 * Markdoc shiki highlighter using the shared AG Docs theme.
 * Preserves the `code` class on `<pre>` for legacy CSS compatibility.
 */
export default function agShiki() {
    return shiki({
        theme: agDocsTheme as any,
        transformers: [
            {
                pre(node) {
                    this.addClassToHast(node, 'code');
                },
            },
        ],
    });
}
