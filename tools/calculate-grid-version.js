/**
 * Calculate and print out the AG Grid version given the AG Charts version
 *
 * Usage: node ./calculate-grid-version 10.1.0
 */

/**
 * Difference between an AG Charts version and AG Grid version
 *
 * The first charts release was on grid version 22
 */
const CHARTS_TO_GRID_VERSION_OFFSET = 22;

/**
 * Convert an AG Charts version to an AG Grid version
 *
 *  * Major version is offset by `CHARTS_TO_GRID_VERSION_OFFSET`
 *  * Minor version stays the same
 *  * Patch version is stays the same
 */
const chartsToGridVersion = (chartsVersion) => {
    const [majorVersion, minorVersion] = chartsVersion.split('.');
    const patch = chartsVersion.slice(`${majorVersion}.${minorVersion}.`.length);
    const patchSplit = patch.split('-');
    const patchNum = Number(patchSplit[0]);

    const gridMajorVersion = parseInt(majorVersion, 10) + CHARTS_TO_GRID_VERSION_OFFSET;
    return `${gridMajorVersion}.${minorVersion}.${patchNum}`;
};

const chartsVersion = process.argv[2];

if (!chartsVersion) {
    throw new Error('No charts version specified');
}

console.log(chartsToGridVersion(chartsVersion));
