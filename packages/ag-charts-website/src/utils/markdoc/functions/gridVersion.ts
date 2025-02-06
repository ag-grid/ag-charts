import { parseVersion } from '@ag-website-shared/utils/parseVersion';
import { agGridVersion } from '@constants';
import type { ConfigFunction } from '@markdoc/markdoc';

export const gridVersion: ConfigFunction = {
    transform() {
        const { major, minor } = parseVersion(agGridVersion);
        return `${major}.${minor}`;
    },
};
