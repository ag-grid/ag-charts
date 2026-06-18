import * as cheerio from 'cheerio';

/**
 * Splits an example `index.html` into its `<link>` elements (which belong in the document
 * `<head>`) and the remaining body content.
 *
 * `<link>` elements left in the body are parsed into the framework component templates,
 * where they are invalid and break rendering. Extracting them lets the generator inject them
 * into the document `<head>` instead, uniformly across all frameworks.
 */
export function extractHeadLinks(html: string): { head: string; body: string } {
    const domTree = cheerio.load(html, null, false);
    const links = domTree('link');

    if (links.length === 0) {
        return { head: '', body: html };
    }

    const head = links
        .toArray()
        .map((elem) => domTree.html(elem))
        .join('\n');

    links.remove();

    return { head, body: domTree.html() ?? '' };
}
