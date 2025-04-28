import type { InternalFramework } from '@ag-grid-types';

import { FILES_TO_HIDE } from '../constants';

interface Params {
    internalFramework: InternalFramework;
    files: Record<string, string>;
}

export function excludeHiddenFiles({ internalFramework, files }: Params) {
    const excludedFiles = Object.assign({}, files);

    Object.keys(FILES_TO_HIDE).forEach((file) => {
        const frameworks = FILES_TO_HIDE[file];
        if (frameworks === true || (frameworks as InternalFramework[]).includes(internalFramework)) {
            delete excludedFiles[file];
        }
    });

    return excludedFiles;
}
