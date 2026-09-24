#!/usr/bin/env node
/* eslint-disable no-console */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELEASE_BRANCH, resolveBranch } from '../../packages/ag-charts-demos/tools/seeds/seed-common.mjs';

/**
 * Post-deploy check that the demo pages' seed links resolve. Two checks, both against GitHub:
 *
 * 1. The deployed pages. Every demo page the site lists (`DEMO_EXAMPLES` in
 *    `packages/ag-charts-website/src/components/demo-examples/exampleRegistry.ts`) is fetched from
 *    the site, and the seed links it actually renders are read off it: the "Open in StackBlitz"
 *    buttons (`data-seed-framework`) and the "See on GitHub" links (`data-seed-source`). Each must
 *    point into this repository's seeds folder at the ref the site should link, and the GitHub
 *    folder each names must resolve. A StackBlitz link cannot be driven headlessly (headless
 *    Chromium never gets past its clone step), but it imports exactly the GitHub folder in its
 *    path, so that folder is what is resolved. A page that renders no seed link although this
 *    checkout has a seed for its demo fails too.
 * 2. The manifests. Every seed with a `seeds/<demo>/<framework>/.seed-manifest.json` in this
 *    checkout must resolve at that ref, which covers the seeds of demos the site does not list.
 *    A manifest naming a different folder fails here as it fails the site build.
 *
 * The ref follows the website's own rule (`getSeedGitRef` in `seedLinks.ts`): a production site
 * links the release tag derived from its version, and every other site, staging included, links
 * the `latest` branch. Production is recognised the same way the site does it, by matching the
 * origin against `PRODUCTION_SITE_URLS` in the website constants.
 *
 * Production is deployed from a release branch, `bX.Y.Z` for version X.Y.Z, so against a
 * production site this check must run from that branch: the version comes from the branch name
 * and the seeds listed are the ones that deployment carries. The site's own `/debug/meta.json`
 * is read as a cross-check and a disagreement fails the run, since it means the checkout is not
 * what was deployed. The branch is resolved by `resolveBranch` in
 * `packages/ag-charts-demos/tools/seeds/seed-common.mjs`: `GITHUB_REF_NAME` in a workflow run, the
 * checked-out branch locally, or `AG_CHARTS_SEED_BRANCH` ahead of either.
 *
 * Usage: node tools/ci/check-demo-seed-links.mjs <site-url>   (from a bX.Y.Z branch for production)
 *   <site-url> includes the site's base path: `https://charts-staging.ag-grid.com` for staging,
 *   `https://www.ag-grid.com/charts` for production.
 * Exits non-zero on any failure. One exception: a release tag with no seeds folder at all
 * predates this feature, so on production that is a warning until the next release is tagged. On
 * `latest` the folder exists from the moment the seeds merge, so a miss there is always a failure.
 */

export const REPOSITORY = 'ag-grid/ag-charts';
export const SEEDS_PATH = 'packages/ag-charts-demos/seeds';
const MANIFEST_FILENAME = '.seed-manifest.json';
export const DEVELOPMENT_REF = 'latest';
const WEBSITE_CONSTANTS = 'packages/ag-charts-website/src/constants.ts';
const DEMO_REGISTRY = 'packages/ag-charts-website/src/components/demo-examples/exampleRegistry.ts';

const WORKSPACE_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

const GITHUB_TREE_PREFIX = `https://github.com/${REPOSITORY}/tree/`;
const STACKBLITZ_TREE_PREFIX = `https://stackblitz.com/github/${REPOSITORY}/tree/`;

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
 * The GitHub folder a rendered seed link opens, and the ref and repository path it names, or an
 * `error` when the link does not point into this repository's seeds folder.
 */
export function resolveSeedLink({ kind, href }) {
    const prefix = kind === 'stackblitz' ? STACKBLITZ_TREE_PREFIX : GITHUB_TREE_PREFIX;
    if (!href.startsWith(prefix)) return { error: `does not start with ${prefix}` };
    const rest = href.slice(prefix.length).split(/[?#]/)[0];
    const separator = rest.indexOf(`/${SEEDS_PATH}/`);
    if (separator <= 0) return { error: `does not point into ${SEEDS_PATH}` };
    const ref = rest.slice(0, separator);
    const path = rest.slice(separator + 1).replace(/\/$/, '');
    if (!/^[^/]+\/[^/]+$/.test(path.slice(SEEDS_PATH.length + 1))) {
        return { error: `does not name a ${SEEDS_PATH}/<demo>/<framework> folder` };
    }
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

/**
 * Runs both checks. Everything that touches the outside world is injected, so the unit tests can
 * run it offline: `fetchImpl` answers every request, `seeds` and `demoPages` stand in for the
 * checkout, `branch` for the current branch (`null` when none is checked out). Returns `{ ok, warnings, errors }` and logs progress
 * through `log`.
 */
export async function checkDemoSeedLinks({
    siteUrl,
    fetchImpl = fetch,
    seeds = listSeeds(),
    demoPages = parseDemoPages(readFileSync(join(WORKSPACE_ROOT, DEMO_REGISTRY), 'utf8')),
    productionSiteUrls = readProductionSiteUrls(),
    branch = resolveBranch,
    log = console.log,
}) {
    const errors = [];
    const warnings = [];
    const site = siteUrl.replace(/\/$/, '');
    const isProduction = productionSiteUrls.includes(new URL(site).origin);

    let ref = DEVELOPMENT_REF;
    if (isProduction) {
        const branchName = branch() ?? 'none, HEAD is detached';
        const release = RELEASE_BRANCH.exec(branchName);
        if (!release) {
            errors.push(
                `${site} is a production site, which deploys from a bX.Y.Z release branch; run this check from that branch so the seeds it lists are the ones the site links (current branch: ${branchName}).`
            );
            return { ok: false, errors, warnings };
        }
        ref = toReleaseTag(release[1]);
        const metaResponse = await fetchImpl(`${site}/debug/meta.json`);
        if (!metaResponse.ok) {
            errors.push(`${site}/debug/meta.json responded ${metaResponse.status}`);
            return { ok: false, errors, warnings };
        }
        const siteVersion = (await metaResponse.json()).versions?.charts;
        if (toReleaseTag(siteVersion) !== ref) {
            errors.push(
                `${site} reports version ${siteVersion} but this checkout is branch ${branchName}; run the check from the branch the site was deployed from.`
            );
            return { ok: false, errors, warnings };
        }
        log(`Production site at version ${siteVersion}, deployed from ${branchName}`);
    }

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

    const seedsRootStatus = await resolveStatus(`${treeUrl}/${SEEDS_PATH}`);
    if (seedsRootStatus === 404 && isProduction) {
        warnings.push(
            `${ref} carries no ${SEEDS_PATH} folder yet; the demo pages' seed links resolve once a release is tagged with the seeds.`
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
    log(`Checking ${seeds.length} seeds at ${treeUrl}/${SEEDS_PATH}`);
    for (const seed of seeds) {
        const url = `${treeUrl}/${SEEDS_PATH}/${seed}`;
        const status = await resolveStatus(url);
        if (status === 200) {
            log(`ok   manifest   ${url}`);
        } else {
            errors.push(`${url} responded ${status}`);
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
