import { parseVersion } from '@ag-website-shared/utils/parseVersion';
import { agChartsVersion, agGridVersion } from '@constants';
import type { ConfigFunction } from '@markdoc/markdoc';

export const gridVersion: ConfigFunction = {
    transform() {
        const { major, minor } = parseVersion(agGridVersion);
        return `${major}.${minor}`;
    },
};

export const gridVersionPatch: ConfigFunction = {
    transform() {
        const { major, minor, patchNum } = parseVersion(agGridVersion);
        return `${major}.${minor}.${patchNum}`;
    },
};

export const chartsVersion: ConfigFunction = {
    transform() {
        const { major, minor } = parseVersion(agChartsVersion);
        return `${major}.${minor}`;
    },
};

export const chartsVersionPatch: ConfigFunction = {
    transform() {
        const { major, minor, patchNum } = parseVersion(agChartsVersion);
        return `${major}.${minor}.${patchNum}`;
    },
};

export const codespaceUrl: ConfigFunction = {
    transform() {
        const { major, minor, patchNum } = parseVersion(agChartsVersion);
        // Pre-release versions (e.g. "13.1.0-beta.20260312") target 'latest';
        // release versions (e.g. "13.1.0") target the matching 'bX.Y.Z' branch.
        const isPreRelease = agChartsVersion.includes('-');
        const ref = isPreRelease ? 'latest' : `b${major}.${minor}.${patchNum}`;
        return `https://codespaces.new/ag-grid/ag-charts-server-side-example?ref=${ref}`;
    },
};
