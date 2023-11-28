/**
 * Remove redundant generated Astro tags:
 *
 * `<link rel="stylesheet" href="/_astro/..." />`
 * `<script type="module"></script>`
 */
export function removeGeneratedAstroTags(indexHtml: string) {
    return indexHtml
        .replaceAll(/<link.*href="\/_astro.* \/>\s*/gm, '')
        .replaceAll('<script type="module"></script>', '');
}
