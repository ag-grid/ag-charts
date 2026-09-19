import type { Plugin } from 'vite';

const SOURCE_PATTERN = /packages\/ag-charts-(community|enterprise|core)\/src\//;

/*
 * The sibling of `agCssAsString`, and removable alongside it once the library
 * source uses an explicit `?raw`. The library imports DOM templates as strings,
 * which Vite resolves to an asset URL rather than the file contents, so
 * `innerHTML = NORMAL_DOM` yields a text node and the chart dies on it.
 */
export default function agHtmlAsString(): Plugin {
    return {
        name: 'ag-html-as-string',
        enforce: 'pre',
        transform(code, id) {
            if (!SOURCE_PATTERN.test(id)) return null;
            if (!/from\s+['"][^'"]+\.html['"]/.test(code)) return null;

            return code.replace(/(from\s+['"][^'"]+\.html)(['"])/g, '$1?raw$2');
        },
    };
}
