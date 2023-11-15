import type { InternalFramework } from '@ag-grid-types';
import { getGeneratedContents, getGeneratedContentsFileList } from '@features/examples-generator/examplesGenerator';
import type { GeneratedContents } from '@features/examples-generator/types';

import { getFolderUrl } from './filesData';

export const getGeneratedDocsContentsFileList = async ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}): Promise<string[]> => {
    const folderUrl = getFolderUrl({
        pageName,
        exampleName,
    });

    return getGeneratedContentsFileList({
        internalFramework,
        folderUrl,
    });
};

export const getGeneratedDocsContents = async ({
    internalFramework,
    pageName,
    exampleName,
    ignoreDarkMode,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
    ignoreDarkMode?: boolean;
}): Promise<GeneratedContents | undefined> => {
    const folderUrl = getFolderUrl({
        pageName,
        exampleName,
    });

    return getGeneratedContents({
        internalFramework,
        folderUrl,
        ignoreDarkMode,
    });
};
