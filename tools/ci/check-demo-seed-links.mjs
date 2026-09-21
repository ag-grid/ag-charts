#!/usr/bin/env node
/* eslint-disable no-console */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Post-deploy check that the demo pages' "See on GitHub" targets resolve: for every seed folder
 * in this checkout, HEAD the GitHub tree URL at the release tag the deployed site links to.
 *
 * The version comes from the site's own `/debug/meta.json`, so this checks the tag the page
 * actually points at, and the tag is derived exactly as the website's link builder derives it
 * (`packages/ag-charts-website/src/components/demo-examples/seedLinks.ts`): the pre-release
 * suffix is dropped, so a beta links to the release it follows.
 *
 * StackBlitz itself is not driven: it needs a real browser session (headless Chromium never gets
 * past its clone step), and it imports the same GitHub folder this verifies.
 *
 * Usage: node tools/ci/check-demo-seed-links.mjs <site-url>
 * Exits non-zero when a seed folder is missing from a tag that carries seeds. A tag with no
 * seeds folder at all predates this feature, so that case is a warning: the site links to the
 * last release until the next one is tagged.
 */

const REPOSITORY = 'ag-grid/ag-charts';
const SEEDS_DIR = 'packages/ag-charts-demos/seeds';

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

const metaResponse = await fetch(`${siteUrl}/debug/meta.json`);
if (!metaResponse.ok) {
    console.error(`check-demo-seed-links: ${siteUrl}/debug/meta.json responded ${metaResponse.status}`);
    process.exit(1);
}
const version = (await metaResponse.json()).versions?.charts;
const tag = toReleaseTag(version);
const treeUrl = `https://github.com/${REPOSITORY}/tree/${tag}`;
console.log(`Site version ${version}; checking seeds at ${treeUrl}/${SEEDS_DIR}`);

const seedsRootStatus = await resolveStatus(`${treeUrl}/${SEEDS_DIR}`);
if (seedsRootStatus === 404) {
    console.log(
        `::warning title=Demo seeds::${tag} carries no ${SEEDS_DIR} folder yet; the demo pages' seed links resolve once a release is tagged with the seeds.`
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
