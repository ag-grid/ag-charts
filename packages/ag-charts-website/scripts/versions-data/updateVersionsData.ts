/* eslint-disable no-console */
import { execSync } from 'child_process';
import * as fs from 'fs/promises';

// Absolute path from the root directory
const VERSIONS_DATA_PATH = 'packages/ag-charts-website/src/content/versions/ag-charts-versions.json';
const MIN_VERSION = '9.0.1';

// Archived charts docs are split across two hosts: everything from 10.1.0 lives on the
// unified site, while 9.x and 10.0.x remain on the standalone charts site.
const PRODUCTION_CHARTS_SITE_URL = 'https://www.ag-grid.com/charts';
const LEGACY_CHARTS_SITE_URL = 'https://charts.ag-grid.com';

// The site rejects non-browser clients with a 403, so identify as one. Without this every
// probe fails, and a failed probe must never be mistaken for a missing archive.
const BROWSER_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// One request per version, so keep them spaced out to avoid being rate limited.
const PROBE_DELAY_MS = 250;

function sortByVersionAsc(a: string, b: string) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) {
            return aParts[i] - bParts[i];
        }
    }
    return 0;
}

function sortByVersionDesc(a: string, b: string) {
    return sortByVersionAsc(b, a);
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mirrors `getArchiveUrl` in external/ag-website-shared/src/utils/getArchiveUrl.ts, which is
 * what the site itself uses to link to archived docs. Kept as a local copy because this
 * script runs as a bare `tsx` entry point with no path-alias resolution.
 */
function getArchiveUrl(version: string) {
    const [major, minor] = version.split('.').map(Number);
    const baseUrl = (major === 10 && minor >= 1) || major > 10 ? PRODUCTION_CHARTS_SITE_URL : LEGACY_CHARTS_SITE_URL;

    return `${baseUrl}/archive/${version}`;
}

/**
 * Whether archived docs are published for a version.
 *
 * Asks the server directly rather than reading the /documentation-archive/ page: that page
 * is generated from this very file, so using it here would be circular - a version missing
 * from the file could never appear on the page, which would flag it `noDocs` and then keep
 * it flagged forever.
 */
async function hasArchivedDocs(version: string) {
    // Request the trailing-slash form, which is the canonical one, so a published version
    // answers 200 in a single request.
    const url = `${getArchiveUrl(version)}/`;
    // Redirects must not be followed: an unpublished version is soft-404'd to
    // /charts/404.html, which itself answers 200 and would otherwise be indistinguishable
    // from a real archive. This is how 9.0.0 and 9.1.1 present.
    const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        headers: { 'User-Agent': BROWSER_USER_AGENT },
    });

    if (response.status === 200) {
        return true;
    }

    if (response.status === 404) {
        return false;
    }

    if (response.status >= 300 && response.status < 400) {
        // A redirect that stays within this version's archive path is a genuine relocation;
        // anything else is the soft-404 described above.
        return (response.headers.get('location') ?? '').includes(`/archive/${version}`);
    }

    // Typically a 403 (blocked) or 429 (rate limited). Treating either as "not archived"
    // would silently drop the version from the selector, so stop instead of guessing.
    throw new Error(`Unexpected ${response.status} ${response.statusText} for ${url}`);
}

function getDaySuffix(day: number) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

function formatDate(isoString: string) {
    const date = new Date(isoString);

    const day = date.getUTCDate();
    const suffix = getDaySuffix(day);

    const options = { month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    return `${formattedDate.split(' ')[0]} ${day}${suffix}, ${formattedDate.split(' ')[1]}`;
}

function getNpmLibraryVersions(library: string) {
    const results = execSync(`npm view ${library} time --json`);
    return JSON.parse(results.toString());
}

function logInitialReport({ versionsDataFile, agVersions, npmVersions, missingNpmVersions, versionsToProbe }) {
    console.log(`${agVersions.length} versions in '${versionsDataFile}'`);
    console.log(`${npmVersions.length} npm versions`);
    console.log(`${versionsToProbe.size} versions to probe for archived docs`);
    console.log(`${missingNpmVersions.length} missing npm versions${missingNpmVersions.length ? ':' : ''}`);
    if (missingNpmVersions.length) {
        console.log(missingNpmVersions);
    }
}

function logFinalReport({ versionsDataFile, allVersions, noDocsUpdated, probeCount }) {
    console.log(`Wrote changes to '${versionsDataFile}'`);
    console.log(`${probeCount} versions probed`);
    console.log(`${noDocsUpdated} noDocs values updated`);
    console.log(`${allVersions.length} versions written`);
}

async function updateNoDocs({ versions, versionsToProbe }) {
    let num = 0;
    let probeCount = 0;
    const updatedVersions = [];

    for (const versionData of versions) {
        // Each probe is a network request, so only spend one where the answer is not already
        // recorded. Pass --recheck-all to re-probe everything.
        if (!versionsToProbe.has(versionData.version)) {
            updatedVersions.push(versionData);
            continue;
        }

        if (probeCount > 0) {
            await delay(PROBE_DELAY_MS);
        }
        probeCount++;

        const newData = { ...versionData };

        if (await hasArchivedDocs(versionData.version)) {
            delete newData.noDocs;

            if (versionData.noDocs) {
                num++;
            }
        } else {
            newData.noDocs = true;

            if (!versionData.noDocs) {
                num++;
            }
        }

        updatedVersions.push(newData);
    }

    return {
        num,
        probeCount,
        versions: updatedVersions,
    };
}

async function updateVersionsData({ isVerbose, recheckAll }: { isVerbose: boolean; recheckAll: boolean }) {
    const versionsDataFile = VERSIONS_DATA_PATH;
    const minVersionParts = MIN_VERSION.split('.').map(Number);
    const agVersions = JSON.parse((await fs.readFile(VERSIONS_DATA_PATH)).toString());
    const allNpmVersionMap = getNpmLibraryVersions('ag-charts-community');
    const npmVersions = Object.keys(allNpmVersionMap)
        .map((version) => {
            const date = allNpmVersionMap[version];
            const formattedDate = formatDate(date);
            return { version, date: formattedDate };
        })
        .filter(({ version }) => {
            return !version.includes('beta');
        })
        .filter(({ version }) => {
            return version.match(/^\d+\.\d+\.\d+$/);
        })
        .filter(({ version }) => {
            const versionParts = version.split('.').map(Number);

            return (
                versionParts[0] > minVersionParts[0] ||
                (versionParts[0] === minVersionParts[0] && versionParts[1] > minVersionParts[1]) ||
                (versionParts[0] === minVersionParts[0] &&
                    versionParts[1] === minVersionParts[1] &&
                    versionParts[2] >= minVersionParts[2])
            );
        });
    const missingNpmVersions = npmVersions.filter(({ version }) => {
        const hasVersion = agVersions.some((agVersion) => version === agVersion.version);
        return !hasVersion;
    });

    const combinedVersions = [...agVersions, ...missingNpmVersions].sort((a, b) => {
        return sortByVersionDesc(a.version, b.version);
    });

    // Versions already in the file have had their `noDocs` flag determined by an earlier run,
    // so by default only the newly discovered ones need a probe.
    const versionsToProbe = new Set(
        recheckAll ? combinedVersions.map(({ version }) => version) : missingNpmVersions.map(({ version }) => version)
    );

    if (isVerbose) {
        logInitialReport({ versionsDataFile, agVersions, npmVersions, missingNpmVersions, versionsToProbe });
    }

    const {
        versions: allVersions,
        num: noDocsUpdated,
        probeCount,
    } = await updateNoDocs({ versions: combinedVersions, versionsToProbe });

    if (missingNpmVersions.length || noDocsUpdated > 0) {
        const updatedVersions = JSON.stringify(allVersions, null, 4) + '\n';

        // Write versions to file
        await fs.writeFile(VERSIONS_DATA_PATH, updatedVersions);

        if (isVerbose) {
            logFinalReport({ versionsDataFile, allVersions, noDocsUpdated, probeCount });
        }
    } else if (isVerbose) {
        console.log('No changes needed');
    }
}

const isVerbose = process.argv.includes('--verbose');
const recheckAll = process.argv.includes('--recheck-all');
// eslint-disable-next-line @typescript-eslint/no-floating-promises
updateVersionsData({ isVerbose, recheckAll });
