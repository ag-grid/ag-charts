import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;
const HIDDEN_REGEX = /^hidden:\s*true\s*$/m;

export function isHiddenFrontmatter(contents: string) {
    const frontmatter = FRONTMATTER_REGEX.exec(contents)?.[1];
    return frontmatter != null && HIDDEN_REGEX.test(frontmatter);
}

/**
 * Names of the docs pages with `hidden: true` in their frontmatter
 *
 * Read from disk, as the astro config that needs them loads before the content collections do.
 */
export function getHiddenDocsPageNames(docsDir: string) {
    return readdirSync(docsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
        .map(({ name }) => name)
        .filter((name) => {
            const pagePath = join(docsDir, name, 'index.mdoc');
            return existsSync(pagePath) && isHiddenFrontmatter(readFileSync(pagePath, 'utf-8'));
        });
}
