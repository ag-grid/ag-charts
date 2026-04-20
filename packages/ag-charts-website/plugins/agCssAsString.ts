import type { Plugin } from 'vite';

const SOURCE_PATTERN = /packages\/ag-charts-(community|enterprise|core)\/src\//;

/*
 * Vite 7 (pulled in by Astro 6) removed the default string export from plain `.css` imports.
 * The library source files use `import STYLES from '.../styles.css'` as a string (fed into
 * `addStyles()` / `enterpriseRegistry.styles`), which relied on that deprecated behaviour.
 * This plugin rewrites those imports to use `?inline` so Vite returns the CSS as a string.
 *
 * Remove this plugin once the library source files either use `?inline` explicitly or stop
 * importing CSS as a string (e.g. by moving style injection into their own build pipeline).
 *
 * Scope: only default-binding imports (`import X from '...css'`). Side-effect imports
 * (`import '...css'`) are intentionally left alone — they rely on Vite's default
 * stylesheet-injection behaviour (e.g. ag-grid's `main-umd-styles.ts`).
 */
export default function agCssAsString(): Plugin {
    return {
        name: 'ag-css-as-string',
        enforce: 'pre',
        transform(code, id) {
            if (!SOURCE_PATTERN.test(id)) return null;
            if (!/from\s+['"][^'"]+\.css['"]/.test(code)) return null;

            return code.replace(/(from\s+['"][^'"]+\.css)(['"])/g, '$1?inline$2');
        },
    };
}
