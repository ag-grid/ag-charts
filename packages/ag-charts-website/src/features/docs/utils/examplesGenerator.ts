import type { InternalFramework } from '../../../types/ag-grid';
import type { GeneratedContents } from '../../examples-generator/types';
import { getFolderUrl } from './filesData';
import { getGeneratedContents, getGeneratedContentsFileList } from '../../examples-generator/examplesGenerator';

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
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}): Promise<GeneratedContents | undefined> => {
    const folderUrl = getFolderUrl({
        pageName,
        exampleName,
    });

    return getGeneratedContents({
        internalFramework,
        folderUrl,
    });
};
