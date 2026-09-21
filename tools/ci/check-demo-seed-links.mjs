#!/usr/bin/env node
/* eslint-disable no-console */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Post-deploy check that the demo pages' "See on GitHub" targets resolve: for every seed folder
 * in this checkout, HEAD the GitHub tree URL at the ref the deployed site links to.
 *
 * The ref follows the website's own rule (`packages/ag-charts-website/src/components/
 * demo-examples/seedLinks.ts`): a production site links the release tag derived from its version
 * (from its `/debug/meta.json`, pre-release suffix dropped), and every other site, staging
 * included, links the `latest` branch. Production is recognised the same way the site does it,
 * by matching the origin against `PRODUCTION_SITE_URLS` in the website constants.
 *
 * StackBlitz itself is not driven: it needs a real browser session (headless Chromium never gets
 * past its clone step), and it imports the same GitHub folder this verifies.
 *
 * Usage: node tools/ci/check-demo-seed-links.mjs <site-url>
 * Exits non-zero when a seed folder is missing at the linked ref. One exception: a release tag
 * with no seeds folder at all predates this feature, so on production that is a warning until
 * the next release is tagged. On `latest` the folder exists from the moment the seeds merge, so
 * a miss there is always a failure.
 */

const REPOSITORY = 'ag-grid/ag-charts';
const SEEDS_DIR = 'packages/ag-charts-demos/seeds';
const DEVELOPMENT_REF = 'latest';
const WEBSITE_CONSTANTS = 'packages/ag-charts-website/src/constants.ts';

const siteUrl = process.argv[2]?.replace(/\/$/, '');
if (!siteUrl) {
    console.error('check-demo-seed-links: a site URL is required.');
    process.exit(1);
}

async function resolveStatus(url) {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return response.status;
}

function toReleaseTag(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
    if (!match) throw new Error(`Cannot derive a release tag from version "${version}"`);
    return `release-${match[1]}.${match[2]}.${match[3]}`;
}

/** The website's production origins, read from the same constant its `getIsProduction()` uses. */
function readProductionSiteUrls() {
    const source = readFileSync(WEBSITE_CONSTANTS, 'utf8');
    const match = /export const PRODUCTION_SITE_URLS\s*=\s*\[([^\]]*)\]/.exec(source);
    if (!match) throw new Error(`Cannot find PRODUCTION_SITE_URLS in ${WEBSITE_CONSTANTS}`);
    return [...match[1].matchAll(/'([^']+)'/g)].map(([, url]) => url);
}

/** `<demo>/<framework>` for every committed seed. */
function listSeeds() {
    const seeds = [];
    for (const demo of readdirSync(SEEDS_DIR, { withFileTypes: true })) {
        if (!demo.isDirectory()) continue;
        for (const framework of readdirSync(join(SEEDS_DIR, demo.name), { withFileTypes: true })) {
            if (framework.isDirectory()) seeds.push(`${demo.name}/${framework.name}`);
        }
    }
    return seeds.sort();
}

const isProduction = readProductionSiteUrls().includes(new URL(siteUrl).origin);

let ref = DEVELOPMENT_REF;
if (isProduction) {
    const metaResponse = await fetch(`${siteUrl}/debug/meta.json`);
    if (!metaResponse.ok) {
        console.error(`check-demo-seed-links: ${siteUrl}/debug/meta.json responded ${metaResponse.status}`);
        process.exit(1);
    }
    const version = (await metaResponse.json()).versions?.charts;
    ref = toReleaseTag(version);
    console.log(`Production site at version ${version}`);
}

const treeUrl = `https://github.com/${REPOSITORY}/tree/${ref}`;
console.log(`Checking seeds at ${treeUrl}/${SEEDS_DIR}`);

const seedsRootStatus = await resolveStatus(`${treeUrl}/${SEEDS_DIR}`);
if (seedsRootStatus === 404 && isProduction) {
    console.log(
        `::warning title=Demo seeds::${ref} carries no ${SEEDS_DIR} folder yet; the demo pages' seed links resolve once a release is tagged with the seeds.`
    );
    process.exit(0);
}

let failed = false;
for (const seed of listSeeds()) {
    const url = `${treeUrl}/${SEEDS_DIR}/${seed}`;
    const status = await resolveStatus(url);
    if (status === 200) {
        console.log(`ok   ${url}`);
    } else {
        failed = true;
        console.log(`::error title=Demo seed missing::${url} responded ${status}`);
    }
}

process.exit(failed ? 1 : 0);
