import type { Plugin } from 'vite';

const SOURCE_PATTERN = /packages\/ag-charts-(community|enterprise|core)\/src\//;

/*
 * The sibling of `agCssAsString`, for the same reason and with the same lifetime.
 *
 * The library source imports DOM templates as strings (`import NORMAL_DOM from
 * './domLayout.html'`), which its own build pipeline resolves to the file
 * contents. Vite instead treats a `.html` import as an asset and hands back a
 * URL, so `templateEl.innerHTML = NORMAL_DOM` produces a text node and the chart
 * dies on the first property access against its root element.
 *
 * This only bites where the site imports the library *source* - the dev-server
 * alias - rather than a built bundle, which is why nothing hit it until a page
 * rendered a chart from an island rather than through the example runner.
 *
 * Remove alongside `agCssAsString` once the library source uses explicit `?raw`.
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
