import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FRAMEWORKS } from '../../constants';

/**
 * Test-only resolver from a site URL to the route that builds it, read from `src/pages` and the
 * docs collection, so tests can check that a link or redirect target names a page that exists
 * without a build.
 *
 * Paths are base-relative (`/react/bar-series/`). A page route is served slashed (`/gallery/`), a
 * `.md.ts` twin at `<page>.md`, and any other endpoint at its own file name (`/llms.txt`).
 */

const SRC_DIR = fileURLToPath(new URL('../../', import.meta.url));
const PAGES_DIR = join(SRC_DIR, 'pages');
const DOCS_DIR = join(SRC_DIR, 'content/docs');

/** Files the build emits from integrations rather than from `src/pages` (non-archive builds). */
const GENERATED_FILES = ['/sitemap-index.xml', '/sitemap-0.xml'];

const docsPageNames = (): Set<string> =>
    new Set(
        readdirSync(DOCS_DIR).filter((name) => statSync(join(DOCS_DIR, name, 'index.mdoc'), { throwIfNoEntry: false }))
    );

/**
 * The values each dynamic route segment may take. Docs pages and frameworks are checked exactly;
 * the rest come from data the routes fan out over at build time and are accepted as any segment.
 */
function segmentMatcher(): (routeDir: string, param: string, value: string) => boolean {
    const docs = docsPageNames();
    return (routeDir, param, value) => {
        if (param === 'framework') {
            return (FRAMEWORKS as readonly string[]).includes(value);
        }
        if (param === 'pageName' && routeDir === '[framework]') {
            return docs.has(value);
        }
        return value.length > 0;
    };
}

interface RouteTemplate {
    segments: string[];
    /** The directory the dynamic segment lives in, for segment-specific value checks. */
    dirs: string[];
}

function listFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? listFiles(full) : [full];
    });
}

function routeTemplates(): RouteTemplate[] {
    return listFiles(PAGES_DIR).flatMap((file) => {
        const parts = relative(PAGES_DIR, file).split(sep);
        const name = parts.pop()!;
        let leaf: string[];
        if (name.endsWith('.astro')) {
            const page = name.slice(0, -'.astro'.length);
            // Astro emits the 404 page as a flat file, which is what an ErrorDocument names.
            if (page === 'index') {
                leaf = [''];
            } else if (page === '404') {
                leaf = ['404.html'];
            } else {
                leaf = [page, ''];
            }
        } else if (name.endsWith('.ts')) {
            leaf = [name.slice(0, -'.ts'.length)];
        } else {
            return [];
        }
        const segments = [...parts, ...leaf];
        return [{ segments, dirs: segments.map((_, i) => segments.slice(0, i).join('/')) }];
    });
}

const SEGMENT_PARAM = /^\[(\.\.\.)?([A-Za-z]+)\](.*)$/;

function matchTemplate(
    template: RouteTemplate,
    urlSegments: string[],
    accepts: ReturnType<typeof segmentMatcher>
): boolean {
    const { segments, dirs } = template;
    for (let i = 0; i < segments.length; i++) {
        const routeSegment = segments[i];
        const param = routeSegment.match(SEGMENT_PARAM);
        if (param?.[1] != null) {
            // A rest parameter takes one or more segments, then the remaining template must match.
            for (let take = 1; i + take <= urlSegments.length; take++) {
                const rest = { segments: segments.slice(i + 1), dirs: dirs.slice(i + 1) };
                if (matchTemplate(rest, urlSegments.slice(i + take), accepts)) {
                    return true;
                }
            }
            return false;
        }
        const urlSegment = urlSegments[i];
        if (urlSegment == null) {
            return false;
        }
        if (param) {
            const suffix = param[3];
            if (!urlSegment.endsWith(suffix)) {
                return false;
            }
            const value = urlSegment.slice(0, urlSegment.length - suffix.length);
            if (!accepts(dirs[i], param[2], value)) {
                return false;
            }
        } else if (routeSegment !== urlSegment) {
            return false;
        }
    }
    return segments.length === urlSegments.length;
}

/**
 * The files a build emits under `basePath` for every route whose parameters can be enumerated here:
 * the static pages and endpoints, and the docs pages once per framework. Routes fanned out over
 * other data (gallery, options, sessions) are left out.
 */
export function enumerablePageFiles(basePath: string): string[] {
    const docs = [...docsPageNames()];
    const expand = (template: RouteTemplate): string[][] => {
        let paths: string[][] = [[]];
        template.segments.forEach((segment, i) => {
            const param = segment.match(SEGMENT_PARAM);
            let values: string[];
            if (!param) {
                values = [segment];
            } else if (param[2] === 'framework' && param[1] == null) {
                values = FRAMEWORKS.map((framework) => `${framework}${param[3]}`);
            } else if (param[2] === 'pageName' && template.dirs[i] === '[framework]') {
                values = docs.map((page) => `${page}${param[3]}`);
            } else {
                values = [];
            }
            paths = paths.flatMap((path) => values.map((value) => [...path, value]));
        });
        return paths;
    };
    return routeTemplates()
        .flatMap(expand)
        .map((segments) => {
            const path = segments.join('/');
            return path === '' || path.endsWith('/') ? `${basePath}/${path}index.html` : `${basePath}/${path}`;
        });
}

/** Build a resolver; reads the page tree once. */
export function createSiteRouteResolver(): (path: string) => boolean {
    const templates = routeTemplates();
    const accepts = segmentMatcher();
    return (path) => {
        if (!path.startsWith('/')) {
            throw new Error(`Expected a base-relative path: ${path}`);
        }
        if (GENERATED_FILES.includes(path)) {
            return true;
        }
        const urlSegments = path.slice(1).split('/');
        return templates.some((template) => matchTemplate(template, urlSegments, accepts));
    };
}
