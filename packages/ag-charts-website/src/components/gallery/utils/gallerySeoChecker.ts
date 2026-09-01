import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** The retired gallery title pattern, which led with the brand instead of a keyword hook. */
const RETIRED_TITLE_PATTERN = 'AG Charts Gallery:';

/**
 * Fingerprint of the retired gallery meta description. Its brand phrasing is still live copy
 * elsewhere on the site, so only the dead editor names identify it without false positives.
 */
const RETIRED_DESCRIPTION_PATTERN = 'CodeSandbox & Plunker';

/** What separates an example page from a head-term hub page: a bare chart name never carries it. */
const EXAMPLE_INTENT = 'Example';

const COPY_SOURCE = 'src/components/gallery/galleryCopy.ts';

const HTML_TAG = /<[^>]*>/g;
const HTML_ENTITY = /&amp;|&lt;|&gt;|&quot;|&#39;/g;
const ENTITY_TEXT: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
};

function captureText(html: string, pattern: RegExp): string | undefined {
    return pattern
        .exec(html)?.[1]
        .replace(HTML_TAG, '')
        .replace(HTML_ENTITY, (entity) => ENTITY_TEXT[entity])
        .trim();
}

const titleOf = (html: string) => captureText(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

const h1Of = (html: string) => captureText(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

// Attribute order is the emitter's choice, so match the description meta from either side.
const metaDescriptionOf = (html: string) =>
    captureText(html, /<meta[^>]*\bname="description"[^>]*\bcontent="([^"]*)"/i) ??
    captureText(html, /<meta[^>]*\bcontent="([^"]*)"[^>]*\bname="description"/i);

/** Everything wrong with one rendered gallery page, so a build reports every offender, not the first. */
export function galleryPageSeoProblems(html: string): string[] {
    const problems: string[] = [];
    const title = titleOf(html);
    const h1 = h1Of(html);

    if (!title) {
        problems.push('serves an empty <title>');
    } else if (title.includes(RETIRED_TITLE_PATTERN)) {
        problems.push(`serves the retired "${RETIRED_TITLE_PATTERN} {name}" title: "${title}"`);
    } else if (!title.includes(EXAMPLE_INTENT)) {
        problems.push(`serves a title that does not name the example intent: "${title}"`);
    }

    const description = metaDescriptionOf(html);
    if (!description) {
        problems.push('serves an empty meta description');
    } else if (description.includes(RETIRED_DESCRIPTION_PATTERN)) {
        problems.push(`serves the retired meta description: "${description}"`);
    }

    if (!h1) {
        problems.push('serves an empty <h1>');
    } else if (!h1.includes(EXAMPLE_INTENT)) {
        problems.push(`serves a bare chart name as its <h1>: "${h1}"`);
    }

    return problems;
}

/** Scoped to the gallery example route: the chart-type hub pages serve a bare chart name by design. */
function galleryExamplePages(buildDir: string) {
    const galleryDir = path.join(buildDir, 'gallery');
    if (!existsSync(galleryDir)) {
        return [];
    }

    return readdirSync(galleryDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
            route: `/gallery/${entry.name}/`,
            file: path.join(galleryDir, entry.name, 'index.html'),
        }))
        .filter(({ file }) => existsSync(file));
}

export function gallerySeoChecker({ buildDir, log }: { buildDir: string; log: (message: string) => void }) {
    const pages = galleryExamplePages(buildDir);
    // A check that silently passes on nothing is worse than no check: the build output has moved.
    if (pages.length === 0) {
        throw new Error(`Gallery SEO check found no example pages under '${path.join(buildDir, 'gallery')}'.`);
    }

    const failures = pages.flatMap(({ route, file }) =>
        galleryPageSeoProblems(readFileSync(file, 'utf-8')).map((problem) => `${route} ${problem}`)
    );

    log(
        `Gallery SEO: ${pages.length} example pages checked, ${failures.length ? `${failures.length} problem/s` : 'all pass'}`
    );

    if (failures.length) {
        throw new Error(
            `Gallery example pages failed the SEO check. Fix their copy in '${COPY_SOURCE}'.\n${failures.join('\n')}`
        );
    }
}
