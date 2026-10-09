#!/usr/bin/env node
/* eslint-disable no-console */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    CHARTS_BUILD_PACKAGES,
    CHARTS_BUILD_SHARED_PACKAGES,
} from '../../packages/ag-charts-demos/tools/seeds/export-seed-mirror.mjs';
import {
    PIN_SOURCE,
    RELEASE_BRANCH,
    readChartsPins,
    resolveBranch,
} from '../../packages/ag-charts-demos/tools/seeds/seed-common.mjs';

/**
 * Post-deploy check that the demo pages' seed links resolve, and that what they open installs. The
 * links open the seeds in the `ag-grid/ag-charts-demos` mirror (`.github/workflows/demo-seeds-mirror.yml`
 * keeps it in step), where each seed is the folder `<demo>/<framework>`. Three checks, against
 * GitHub and the site:
 *
 * 1. The deployed pages. Every demo page the site lists (`DEMO_EXAMPLES` in
 *    `packages/ag-charts-website/src/components/demo-examples/exampleRegistry.ts`) is fetched from
 *    the site, and the seed links it actually renders are read off it: the "Open in StackBlitz"
 *    menu's links (`data-seed-framework`) and the "See on GitHub" menu's (`data-seed-source`). Each
 *    must point at a seed folder of the mirror at the ref the site should link, and the GitHub
 *    folder each names must resolve. A StackBlitz link cannot be driven headlessly (headless
 *    Chromium never gets past its clone step), but it imports exactly the GitHub folder in its
 *    path, so that folder is what is resolved. A page that renders no seed link although this
 *    checkout has a seed for its demo fails too.
 * 2. The manifests. Every seed with a `seeds/<demo>/<framework>/.seed-manifest.json` in this
 *    checkout must resolve in the mirror at that ref, which covers the seeds of demos the site
 *    does not list. A manifest naming a different folder fails here as it fails the site build.
 *    The mirror's copy of each manifest is compared with the checkout's, and a difference is a
 *    warning: the mirror is behind (a sync failed) or already ahead (a later commit synced first).
 * 3. The build tarballs. At the `staging` and `bX.Y.Z` refs the mirror exports every seed whose
 *    manifest has `pinSource` `dist-tag` with its `ag-charts-*` dependencies (and the matching
 *    `overrides`) pointing at the tarballs the site serves at `<site>/npm-packages/<name>.tgz`.
 *    The mirror's `package.json` of each such seed must carry exactly those URLs, and each URL must
 *    answer a `HEAD` with 200 and the CORS preflight StackBlitz's in-browser npm sends before every
 *    tarball fetch with `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers` (the
 *    latter naming npm's own request headers, or `*`): without them the install dies in the browser
 *    however well the seed links resolve. The release tag's seeds install from npm and need none.
 *
 * The ref follows the website's own rule (`getSeedGitRef` in `seedLinks.ts`): a production site
 * links the release tag derived from its version, an archive (`<production>/archive/X.Y.Z`) the
 * release branch `bX.Y.Z`, and every other site, staging included, the `staging` branch. Production
 * and archives are recognised the same way the site does it, by matching the origin against
 * `PRODUCTION_SITE_URLS` in the website constants and, for an archive, `archive` in the base path.
 *
 * Production and archives are deployed from a release branch, `bX.Y.Z` for version X.Y.Z, so
 * against either this check must run from that branch: the version comes from the branch name and
 * the seeds listed are the ones that deployment carries. The site's own `/debug/meta.json` is read
 * as a cross-check and a disagreement fails the run, since it means the checkout is not what was
 * deployed. The branch is resolved by `resolveBranch` in
 * `packages/ag-charts-demos/tools/seeds/seed-common.mjs`: `GITHUB_REF_NAME` in a workflow run, the
 * checked-out branch locally, or `AG_CHARTS_SEED_BRANCH` ahead of either.
 *
 * Usage: node tools/ci/check-demo-seed-links.mjs <site-url>   (from a bX.Y.Z branch for production or an archive)
 *   <site-url> includes the site's base path: `https://charts-staging.ag-grid.com` for staging,
 *   `https://www.ag-grid.com/charts` for production and `https://www.ag-grid.com/charts/archive/X.Y.Z`
 *   for an archive.
 * Exits non-zero on any failure. One exception: a release with no tag in the mirror predates the
 * mirror, so on production that is a warning until the next release is tagged. At the `staging`
 * and `bX.Y.Z` refs a miss is always a failure: the mirror syncs `staging` after the staging
 * deploy, and a release branch on every push to it.
 */

/** The repository the seed links open; the seeds live in this one under `SEEDS_PATH`. */
export const MIRROR_REPOSITORY = 'ag-grid/ag-charts-demos';
export const SEEDS_PATH = 'packages/ag-charts-demos/seeds';
const MANIFEST_FILENAME = '.seed-manifest.json';
/** The mirror branch every site that is neither production nor an archive links. */
export const STAGING_REF = 'staging';
/** Where a site serves its package tarballs, relative to its base: `<site>/npm-packages/<name>.tgz`. */
export const NPM_PACKAGES_DIR = 'npm-packages';
/**
 * The request headers StackBlitz's in-browser npm sends with every tarball fetch (npm's own and
 * pacote's), which is what makes the browser preflight it; a host must allow them.
 */
export const PREFLIGHT_REQUEST_HEADERS = [
    'npm-auth-type',
    'npm-command',
    'pacote-pkg-id',
    'pacote-req-type',
    'pacote-version',
];
const PREFLIGHT_ORIGIN = 'https://stackblitz.com';
const WEBSITE_CONSTANTS = 'packages/ag-charts-website/src/constants.ts';
const DEMO_REGISTRY = 'packages/ag-charts-website/src/components/demo-examples/exampleRegistry.ts';

const WORKSPACE_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

const GITHUB_TREE_PREFIX = `https://github.com/${MIRROR_REPOSITORY}/tree/`;
const STACKBLITZ_TREE_PREFIX = `https://stackblitz.com/github/${MIRROR_REPOSITORY}/tree/`;
const RAW_PREFIX = `https://raw.githubusercontent.com/${MIRROR_REPOSITORY}/`;

/** The seed attribute each kind of link carries on the demo page (`DemoPage.astro` in ag-website-shared). */
const SEED_LINK_ATTRIBUTES = { 'data-seed-framework': 'stackblitz', 'data-seed-source': 'github' };

export function toReleaseTag(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? '');
    if (!match) throw new Error(`Cannot derive a release tag from version "${version}"`);
    return `release-${match[1]}.${match[2]}.${match[3]}`;
}

/** The website's production origins, read from the same constant its `getIsProduction()` uses. */
export function readProductionSiteUrls(root = WORKSPACE_ROOT) {
    const source = readFileSync(join(root, WEBSITE_CONSTANTS), 'utf8');
    const match = /export const PRODUCTION_SITE_URLS\s*=\s*\[([^\]]*)\]/.exec(source);
    if (!match) throw new Error(`Cannot find PRODUCTION_SITE_URLS in ${WEBSITE_CONSTANTS}`);
    return [...match[1].matchAll(/'([^']+)'/g)].map(([, url]) => url);
}

/** The staging site's origin, read from the website constants (`STAGING_SITE_URL`). */
export function readStagingSiteUrl(root = WORKSPACE_ROOT) {
    const source = readFileSync(join(root, WEBSITE_CONSTANTS), 'utf8');
    const match = /export const STAGING_SITE_URL\s*=\s*'([^']+)'/.exec(source);
    if (!match) throw new Error(`Cannot find STAGING_SITE_URL in ${WEBSITE_CONSTANTS}`);
    return match[1];
}

/** Whether a site URL is an archive (`<production>/archive/X.Y.Z`), as `getIsArchive` decides it on the site. */
export function isArchiveUrl(siteUrl) {
    return `${new URL(siteUrl).pathname.replace(/\/$/, '')}/`.includes('/archive/');
}

/**
 * The demo pages the site lists, as `{ path, demoId }` with `path` relative to the site root
 * (`examples/`). Read off the registry's active entries: commented-out entries are skipped, and
 * every entry must carry both a `path` and a `demoAppId`.
 */
export function parseDemoPages(registrySource) {
    const active = registrySource
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n');
    const start = active.indexOf('DEMO_EXAMPLES');
    if (start === -1) throw new Error(`Cannot find DEMO_EXAMPLES in ${DEMO_REGISTRY}`);
    const list = active.slice(start, active.indexOf('];', start));
    const paths = [...list.matchAll(/\bpath:\s*'([^']+)'/g)].map(([, path]) => path.replace(/^\.\//, ''));
    const demoIds = [...list.matchAll(/\bdemoAppId:\s*'([^']+)'/g)].map(([, id]) => id);
    if (paths.length === 0 || paths.length !== demoIds.length) {
        throw new Error(
            `${DEMO_REGISTRY}: found ${paths.length} page paths and ${demoIds.length} demo ids in DEMO_EXAMPLES`
        );
    }
    return paths.map((path, index) => ({ path, demoId: demoIds[index] }));
}

function decodeEntities(value) {
    return value
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/**
 * The seed links a rendered demo page carries, in document order, as
 * `{ kind: 'stackblitz' | 'github', framework, href }`.
 */
export function parseSeedLinks(html) {
    const links = [];
    for (const [, attributeText] of html.matchAll(/<a\b([^>]*)>/gi)) {
        const attributes = {};
        for (const [, name, doubleQuoted, singleQuoted, bare] of attributeText.matchAll(
            /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
        )) {
            attributes[name.toLowerCase()] = decodeEntities(doubleQuoted ?? singleQuoted ?? bare ?? '');
        }
        for (const [attribute, kind] of Object.entries(SEED_LINK_ATTRIBUTES)) {
            if (attribute in attributes) {
                links.push({ kind, framework: attributes[attribute], href: attributes.href ?? '' });
            }
        }
    }
    return links;
}

/**
 * The mirror folder a rendered seed link opens, and the ref and `<demo>/<framework>` path it
 * names, or an `error` when the link does not point at a seed folder of the mirror. The mirror's
 * refs (`latest`, `release-X.Y.Z`) never contain a slash, so the ref is the first path segment.
 */
export function resolveSeedLink({ kind, href }) {
    const prefix = kind === 'stackblitz' ? STACKBLITZ_TREE_PREFIX : GITHUB_TREE_PREFIX;
    if (!href.startsWith(prefix)) return { error: `does not start with ${prefix}` };
    const rest = href.slice(prefix.length).split(/[?#]/)[0];
    const match = /^([^/]+)\/([^/]+\/[^/]+)\/?$/.exec(rest);
    if (!match) return { error: `does not name a <demo>/<framework> folder of ${MIRROR_REPOSITORY}` };
    const [, ref, path] = match;
    return { ref, path, githubUrl: `${GITHUB_TREE_PREFIX}${ref}/${path}` };
}

function listDirectories(dir) {
    return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

/**
 * `<demo>/<framework>` for every seed with a manifest, sorted. A manifest that does not parse or
 * that names a different folder is an error: the site build rejects it too.
 */
export function listSeeds(root = WORKSPACE_ROOT) {
    const seedsDir = join(root, SEEDS_PATH);
    if (!existsSync(seedsDir)) throw new Error(`${SEEDS_PATH} does not exist in this checkout`);
    const seeds = [];
    for (const demo of listDirectories(seedsDir)) {
        for (const framework of listDirectories(join(seedsDir, demo))) {
            const manifestPath = join(seedsDir, demo, framework, MANIFEST_FILENAME);
            if (!existsSync(manifestPath)) continue;
            let manifest;
            try {
                manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            } catch (error) {
                throw new Error(`${manifestPath} is not valid JSON: ${error.message}`);
            }
            if (manifest.demo !== demo || manifest.framework !== framework) {
                throw new Error(
                    `${manifestPath} names ${manifest.demo}/${manifest.framework} but lives at ${demo}/${framework}`
                );
            }
            seeds.push(`${demo}/${framework}`);
        }
    }
    if (seeds.length === 0) throw new Error(`No ${MANIFEST_FILENAME} found under ${SEEDS_PATH}`);
    return seeds;
}

/** The checkout's `.seed-manifest.json` for `<demo>/<framework>`, as text. */
export function readManifest(seed, root = WORKSPACE_ROOT) {
    return readFileSync(join(root, SEEDS_PATH, seed, MANIFEST_FILENAME), 'utf8');
}

/**
 * The AG Charts packages the mirror's export of a seed installs from tarballs, in
 * `CHARTS_BUILD_PACKAGES` order: the ones the seed depends on and the shared ones npm reaches
 * through `ag-grid-community` and `ag-grid-enterprise`, which the export overrides.
 */
function listBuildPackages(packageJson) {
    const wanted = new Set([...CHARTS_BUILD_SHARED_PACKAGES, ...Object.keys(readChartsPins(packageJson))]);
    return CHARTS_BUILD_PACKAGES.filter((name) => wanted.has(name));
}

/**
 * What is wrong with a seed's `package.json` as the mirror exports it for a build served at
 * `<buildBase>/<name>.tgz` (`rewriteChartsBuildPins`), as sentences; empty when it is right: every
 * `ag-charts-*` dependency is its tarball URL, and `overrides` holds the same URL for the shared
 * packages and for each AG Charts package the seed depends on directly.
 */
export function describeBuildPinProblems(packageJson, buildBase) {
    const urlOf = (name) => `${buildBase}/${name}.tgz`;
    const problems = Object.entries(readChartsPins(packageJson))
        .filter(([name, version]) => version !== urlOf(name))
        .map(([name, version]) => `depends on ${name} "${version}", expected ${urlOf(name)}`);
    for (const name of listBuildPackages(packageJson)) {
        const override = packageJson.overrides?.[name];
        if (override !== urlOf(name)) {
            problems.push(
                `overrides ${name} with ${override === undefined ? 'nothing' : `"${override}"`}, expected ${urlOf(name)}`
            );
        }
    }
    return problems;
}

/**
 * What is wrong with a tarball's answer to the CORS preflight StackBlitz's npm sends, as
 * sentences; empty when it would be accepted: a 2xx status, `Access-Control-Allow-Origin` naming
 * every origin or `PREFLIGHT_ORIGIN`, and `Access-Control-Allow-Headers` allowing every header in
 * `PREFLIGHT_REQUEST_HEADERS` (`*` allows them all).
 */
export function describePreflightProblems(response) {
    if (!(response.status >= 200 && response.status < 300)) {
        return [`answers the CORS preflight (OPTIONS) with ${response.status}`];
    }
    const problems = [];
    const allowOrigin = response.headers.get('access-control-allow-origin');
    if (allowOrigin !== '*' && allowOrigin !== PREFLIGHT_ORIGIN) {
        problems.push(
            `sends Access-Control-Allow-Origin ${allowOrigin === null ? 'nothing' : `"${allowOrigin}"`} to the preflight`
        );
    }
    const allowHeaders = response.headers.get('access-control-allow-headers');
    if (allowHeaders === null) {
        problems.push('sends no Access-Control-Allow-Headers to the preflight');
    } else {
        const allowed = allowHeaders.split(',').map((header) => header.trim().toLowerCase());
        const missing = PREFLIGHT_REQUEST_HEADERS.filter((header) => !allowed.includes(header));
        if (!allowed.includes('*') && missing.length > 0) {
            problems.push(
                `does not allow the request headers ${missing.join(', ')} in Access-Control-Allow-Headers "${allowHeaders}"`
            );
        }
    }
    return problems;
}

/**
 * Runs the checks. Everything that touches the outside world is injected, so the unit tests can
 * run it offline: `fetchImpl` answers every request, `seeds`, `demoPages` and `readSeedManifest`
 * stand in for the checkout, `branch` for the current branch (`null` when none is checked out).
 * Returns `{ ok, warnings, errors }` and logs progress through `log`.
 */
export async function checkDemoSeedLinks({
    siteUrl,
    fetchImpl = fetch,
    seeds = listSeeds(),
    readSeedManifest = readManifest,
    demoPages = parseDemoPages(readFileSync(join(WORKSPACE_ROOT, DEMO_REGISTRY), 'utf8')),
    productionSiteUrls = readProductionSiteUrls(),
    stagingSiteUrl = readStagingSiteUrl(),
    branch = resolveBranch,
    log = console.log,
}) {
    const errors = [];
    const warnings = [];
    const site = siteUrl.replace(/\/$/, '');
    const isProduction = productionSiteUrls.includes(new URL(site).origin);

    let ref = STAGING_REF;
    const isArchive = isProduction && isArchiveUrl(site);
    if (isProduction) {
        const branchName = branch() ?? 'none, HEAD is detached';
        const release = RELEASE_BRANCH.exec(branchName);
        if (!release) {
            errors.push(
                `${site} is a production site, which deploys from a bX.Y.Z release branch; run this check from that branch so the seeds it lists are the ones the site links (current branch: ${branchName}).`
            );
            return { ok: false, errors, warnings };
        }
        const releaseTag = toReleaseTag(release[1]);
        ref = isArchive ? branchName : releaseTag;
        const metaResponse = await fetchImpl(`${site}/debug/meta.json`);
        if (!metaResponse.ok) {
            errors.push(`${site}/debug/meta.json responded ${metaResponse.status}`);
            return { ok: false, errors, warnings };
        }
        const siteVersion = (await metaResponse.json()).versions?.charts;
        if (toReleaseTag(siteVersion) !== releaseTag) {
            errors.push(
                `${site} reports version ${siteVersion} but this checkout is branch ${branchName}; run the check from the branch the site was deployed from.`
            );
            return { ok: false, errors, warnings };
        }
        log(`${isArchive ? 'Archive' : 'Production site'} at version ${siteVersion}, deployed from ${branchName}`);
    }
    const isReleaseTag = isProduction && !isArchive;

    const statuses = new Map();
    const resolveStatus = (url) => {
        if (!statuses.has(url)) {
            statuses.set(
                url,
                fetchImpl(url, { method: 'HEAD', redirect: 'follow' }).then((response) => response.status)
            );
        }
        return statuses.get(url);
    };
    const treeUrl = `${GITHUB_TREE_PREFIX}${ref}`;

    const mirrorRootStatus = await resolveStatus(treeUrl);
    if (mirrorRootStatus === 404 && isReleaseTag) {
        warnings.push(
            `${MIRROR_REPOSITORY} has no ${ref} yet; the demo pages' seed links resolve once a release is tagged with the seeds.`
        );
        return { ok: true, errors, warnings };
    }

    // 1. The links the deployed pages render.
    for (const { path, demoId } of demoPages) {
        const pageUrl = `${site}/${path}`;
        const response = await fetchImpl(pageUrl, { redirect: 'follow' });
        if (!response.ok) {
            errors.push(`${pageUrl} responded ${response.status}`);
            continue;
        }
        const links = parseSeedLinks(await response.text());
        const expected = seeds.filter((seed) => seed.startsWith(`${demoId}/`));
        log(`${pageUrl}: ${links.length} seed links rendered, ${expected.length} seeds in this checkout`);
        if (links.length === 0 && expected.length > 0) {
            errors.push(`${pageUrl} renders no seed links, but this checkout has seeds ${expected.join(', ')}`);
            continue;
        }
        for (const link of links) {
            const label = `${pageUrl} ${link.kind} link (${link.framework || 'no framework'}) ${link.href || '(no href)'}`;
            const resolved = resolveSeedLink(link);
            if (resolved.error) {
                errors.push(`${label} ${resolved.error}`);
                continue;
            }
            if (resolved.ref !== ref) {
                errors.push(`${label} links ref ${resolved.ref}, but this site should link ${ref}`);
                continue;
            }
            const status = await resolveStatus(resolved.githubUrl);
            if (status === 200) {
                log(`ok   ${link.kind.padEnd(10)} ${resolved.githubUrl}`);
            } else {
                errors.push(`${label}: ${resolved.githubUrl} responded ${status}`);
            }
        }
    }

    // 2. Every seed this checkout declares, listed on a page or not.
    log(`Checking ${seeds.length} seeds at ${treeUrl}`);
    for (const seed of seeds) {
        const url = `${treeUrl}/${seed}`;
        const status = await resolveStatus(url);
        if (status !== 200) {
            errors.push(`${url} responded ${status}`);
            continue;
        }
        log(`ok   manifest   ${url}`);
        const mirrored = await fetchImpl(`${RAW_PREFIX}${ref}/${seed}/${MANIFEST_FILENAME}`);
        if (!mirrored.ok) {
            warnings.push(
                `${seed}/${MANIFEST_FILENAME} could not be read from ${MIRROR_REPOSITORY} at ${ref} (${mirrored.status}).`
            );
        } else if ((await mirrored.text()) !== readSeedManifest(seed)) {
            warnings.push(
                `${MIRROR_REPOSITORY} ${ref} has a different ${seed}/${MANIFEST_FILENAME} from this checkout: the mirror is behind (check the "Mirror Demo Seeds" runs) or already carries a later commit.`
            );
        }
    }

    // 3. The build tarballs the rewritten seeds install; a release tag's seeds install from npm.
    if (!isReleaseTag) {
        // An archive serves its own tarballs; staging, dev and preview sites link the staging ones.
        const buildBase = `${isArchive ? site : stagingSiteUrl.replace(/\/$/, '')}/${NPM_PACKAGES_DIR}`;
        const tarballs = new Map();
        for (const seed of seeds) {
            if (JSON.parse(readSeedManifest(seed)).pinSource !== PIN_SOURCE.distTag) continue;
            const manifestUrl = `${RAW_PREFIX}${ref}/${seed}/package.json`;
            const mirrored = await fetchImpl(manifestUrl);
            if (!mirrored.ok) {
                errors.push(`${manifestUrl} responded ${mirrored.status}`);
                continue;
            }
            let packageJson;
            try {
                packageJson = JSON.parse(await mirrored.text());
            } catch (error) {
                errors.push(`${manifestUrl} is not valid JSON: ${error.message}`);
                continue;
            }
            const problems = describeBuildPinProblems(packageJson, buildBase);
            for (const problem of problems) {
                errors.push(`${MIRROR_REPOSITORY} ${ref} ${seed}/package.json ${problem}`);
            }
            if (problems.length === 0) {
                for (const name of listBuildPackages(packageJson)) {
                    const url = `${buildBase}/${name}.tgz`;
                    if (!tarballs.has(url)) tarballs.set(url, seed);
                }
            }
        }
        log(`Checking ${tarballs.size} build tarballs at ${buildBase}`);
        for (const [url, seed] of tarballs) {
            const status = await resolveStatus(url);
            const problems = status === 200 ? [] : [`responds ${status}`];
            const preflight = await fetchImpl(url, {
                method: 'OPTIONS',
                headers: {
                    Origin: PREFLIGHT_ORIGIN,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': PREFLIGHT_REQUEST_HEADERS.join(','),
                },
            });
            problems.push(...describePreflightProblems(preflight));
            for (const problem of problems) {
                errors.push(`${url} (a dependency of ${seed} at ${ref}) ${problem}`);
            }
            if (problems.length === 0) log(`ok   tarball    ${url}`);
        }
    }

    return { ok: errors.length === 0, errors, warnings };
}

async function main(argv) {
    const siteUrl = argv[0];
    if (!siteUrl) {
        console.error('check-demo-seed-links: a site URL is required.');
        return 1;
    }
    const { ok, errors, warnings } = await checkDemoSeedLinks({ siteUrl });
    for (const warning of warnings) console.log(`::warning title=Demo seeds::${warning}`);
    for (const error of errors) console.log(`::error title=Demo seed link::${error}`);
    return ok ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).then(
        (status) => process.exit(status),
        (error) => {
            console.error(`check-demo-seed-links: ${error.message}`);
            process.exit(1);
        }
    );
}
