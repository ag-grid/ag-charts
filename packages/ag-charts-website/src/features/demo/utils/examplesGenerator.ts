import type { InternalFramework } from '../../../types/ag-grid';
import type { GeneratedContents } from '../../examples-generator/types';
import { getGeneratedContents, getGeneratedContentsFileList } from '../../examples-generator/examplesGenerator';
import { getFolderUrl } from './filesData';
import { DEMO_INTERNAL_FRAMEWORK } from '../constants';

export const getGeneratedDemoContentsFileList = async ({ exampleName }: { exampleName: string }): Promise<string[]> => {
    const folderUrl = getFolderUrl({
        exampleName,
    });

    return getGeneratedContentsFileList({
        internalFramework: DEMO_INTERNAL_FRAMEWORK,
        folderUrl,
    });
};

export const getGeneratedDemoContents = async ({
    exampleName,
}: {
    exampleName: string;
}): Promise<GeneratedContents | undefined> => {
    const folderUrl = getFolderUrl({
        exampleName,
    });

    return getGeneratedContents({
        internalFramework: DEMO_INTERNAL_FRAMEWORK,
        folderUrl,
    });
};
