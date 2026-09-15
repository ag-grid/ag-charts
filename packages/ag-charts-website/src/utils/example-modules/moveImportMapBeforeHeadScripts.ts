const IMPORT_MAP_SCRIPT_REGEXP = /\s*<script type="importmap">[\s\S]*?<\/script>/;
const HEAD_OPEN_TAG_REGEXP = /<head[^>]*>/i;

/**
 * Relocates a document's `<script type="importmap">` (wherever it appears, typically in `<body>`
 * per `ExampleModules`) to immediately follow the opening `<head>` tag.
 *
 * Astro's dev server injects `<script type="module" src="/@vite/client">` as the first element of
 * `<head>` on every page. Per the HTML spec, a document's ability to register an import map closes
 * once any module script's fetch has started -- so an import map declared later, in `<body>`, is
 * already too late once that happens. Chrome tolerates the misordering; Firefox enforces the spec
 * and fails every bare-specifier resolution in the entry module ("was a bare specifier, but was not
 * remapped to anything"). Moving the import map ahead of `/@vite/client` fixes the registration
 * order for both. Production serves no such dev-only script, so it never needs this.
 */
export function moveImportMapBeforeHeadScripts(html: string): string {
    const match = html.match(IMPORT_MAP_SCRIPT_REGEXP);
    if (!match) {
        return html;
    }

    const [importMapScript] = match;
    const withoutOriginal = html.replace(importMapScript, '');
    return withoutOriginal.replace(HEAD_OPEN_TAG_REGEXP, (headOpenTag) => `${headOpenTag}${importMapScript}`);
}
