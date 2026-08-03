/* eslint-disable no-console */
import { execSync } from 'child_process';
import * as fs from 'fs/promises';

// Absolute path from the root directory
const VERSIONS_DATA_PATH = 'packages/ag-charts-website/src/content/versions/ag-charts-versions.json';
// Supersedes the two URLs this previously read. The legacy charts.ag-grid.com/archive
// listing only went up to 10.1.0, and every version it listed also appears here.
const WEBSITE_ARCHIVE_URL = 'https://www.ag-grid.com/charts/documentation-archive/';
const MIN_VERSION = '9.0.1';

// The archive page is served behind a filter that rejects non-browser clients with
// a 403, so identify as one. Without this every request fails and the script would
// conclude that no version has archived docs.
const BROWSER_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

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

function extractVersionsFromHref(html: string) {
    const hrefRegex = /href="[^"]*\/archive\/(\d+\.\d+\.\d+)(?:\/|")/g;

    const versions = [];
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
        versions.push(match[1]);
    }

    return [...new Set(versions)].sort(sortByVersionAsc);
}

async function getWebsiteVersions() {
    const response = await fetch(WEBSITE_ARCHIVE_URL, { headers: { 'User-Agent': BROWSER_USER_AGENT } });

    if (!response.ok) {
        throw new Error(`Could not read ${WEBSITE_ARCHIVE_URL}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const versions = extractVersionsFromHref(html);

    // Every version is compared against this list to decide its `noDocs` flag, so an
    // empty result is never legitimate: it would mark the entire file as having no
    // archived docs. Treat it as a broken URL or changed page markup instead.
    if (versions.length === 0) {
        throw new Error(`Found no archived versions at ${WEBSITE_ARCHIVE_URL}; the URL or its markup has changed`);
    }

    return versions;
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

function logInitialReport({ versionsDataFile, agVersions, npmVersions, missingNpmVersions, websiteVersions }) {
    console.log(`${agVersions.length} versions in '${versionsDataFile}'`);
    console.log(`${npmVersions.length} npm versions`);
    console.log(`${websiteVersions.length} website versions`);
    console.log(`${missingNpmVersions.length} missing npm versions${missingNpmVersions.length ? ':' : ''}`);
    if (missingNpmVersions.length) {
        console.log(missingNpmVersions);
    }
}

function logFinalReport({ versionsDataFile, allVersions, noDocsUpdated }) {
    console.log(`Wrote changes to '${versionsDataFile}'`);
    console.log(`${noDocsUpdated} noDocs values updated`);
    console.log(`${allVersions.length} versions written`);
}

function updateNoDocs({ versions, websiteVersions }) {
    let num = 0;
    // Check website to see if version has docs. `versions` is sorted newest-first, and
    // the newest entry is the live release, whose docs are served from the main site
    // rather than the archive - so it is never in `websiteVersions`. Exempt it, or it
    // would be flagged `noDocs` and dropped from the version selector.
    const updatedVersions = versions.map((versionData, index) => {
        const noDocs = index > 0 && !websiteVersions.includes(versionData.version);

        const newData = { ...versionData };

        if (noDocs) {
            newData.noDocs = true;

            if (!versionData.noDocs) {
                num++;
            }
        } else {
            delete newData.noDocs;

            if (versionData.noDocs) {
                num++;
            }
        }

        return newData;
    });

    return {
        num,
        versions: updatedVersions,
    };
}

async function updateVersionsData({ isVerbose }: { isVerbose: boolean }) {
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
    const websiteVersions = await getWebsiteVersions();

    const missingNpmVersions = npmVersions.filter(({ version }) => {
        const hasVersion = agVersions.some((agVersion) => version === agVersion.version);
        return !hasVersion;
    });

    if (isVerbose) {
        logInitialReport({ versionsDataFile, agVersions, npmVersions, missingNpmVersions, websiteVersions });
    }

    const combinedVersions = [...agVersions, ...missingNpmVersions].sort((a, b) => {
        return sortByVersionDesc(a.version, b.version);
    });
    const { versions: allVersions, num: noDocsUpdated } = updateNoDocs({ versions: combinedVersions, websiteVersions });

    if (missingNpmVersions.length || noDocsUpdated > 0) {
        const updatedVersions = JSON.stringify(allVersions, null, 4) + '\n';

        // Write versions to file
        await fs.writeFile(VERSIONS_DATA_PATH, updatedVersions);

        if (isVerbose) {
            logFinalReport({ versionsDataFile, allVersions, noDocsUpdated });
        }
    } else if (isVerbose) {
        console.log('No changes needed');
    }
}

const isVerbose = process.argv.includes('--verbose');
// eslint-disable-next-line @typescript-eslint/no-floating-promises
updateVersionsData({ isVerbose });
