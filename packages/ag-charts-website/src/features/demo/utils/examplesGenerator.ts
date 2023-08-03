import type { GeneratedContents } from '../../examples-generator/types';
import { getGeneratedContents, getGeneratedContentsFileList } from '../../examples-generator/examplesGenerator';
import { getFolderUrl } from './filesData';
import { DEMO_INTERNAL_FRAMEWORK, PLAIN_ENTRY_FILE_NAME } from '../constants';
import { transformPlainEntryFile } from './transformPlainEntryFile';

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

export const getGeneratedPlainDemoContents = async ({ exampleName }: { exampleName: string }) => {
    const generatedContents = await getGeneratedDemoContents({
        exampleName,
    });
    const { entryFileName, files = {} } = generatedContents || {};
    const { [entryFileName!]: entryFile, ...otherFiles } = files;
    const plainEntryFile = transformPlainEntryFile(entryFile);
    // Replace entry file with plain one
    const plainScriptFiles = generatedContents?.scriptFiles
        .filter((fileName) => {
            return fileName !== entryFileName;
        })
        .concat(PLAIN_ENTRY_FILE_NAME);
    const plainFiles = {
        ...otherFiles,
        [PLAIN_ENTRY_FILE_NAME]: plainEntryFile,
    };

    return {
        ...generatedContents,
        scriptFiles: plainScriptFiles,
        files: plainFiles,
    };
};
