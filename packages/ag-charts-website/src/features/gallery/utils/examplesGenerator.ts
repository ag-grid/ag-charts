import { getGeneratedContents, getGeneratedContentsFileList } from '@features/examples-generator/examplesGenerator';
import type { GeneratedContents } from '@features/examples-generator/types';
import { GALLERY_INTERNAL_FRAMEWORK, PLAIN_ENTRY_FILE_NAME } from '../constants';
import { getFolderUrl } from './filesData';
import { transformPlainEntryFile } from './transformPlainEntryFile';

export const getGeneratedGalleryContentsFileList = async ({
    exampleName,
}: {
    exampleName: string;
}): Promise<string[]> => {
    const folderUrl = getFolderUrl({
        exampleName,
    });

    return getGeneratedContentsFileList({
        internalFramework: GALLERY_INTERNAL_FRAMEWORK,
        folderUrl,
    });
};

export const getGeneratedGalleryContents = async ({
    exampleName,
}: {
    exampleName: string;
}): Promise<GeneratedContents | undefined> => {
    const folderUrl = getFolderUrl({
        exampleName,
    });

    return getGeneratedContents({
        internalFramework: GALLERY_INTERNAL_FRAMEWORK,
        folderUrl,
    });
};

export const getGeneratedPlainGalleryContents = async ({ exampleName }: { exampleName: string }) => {
    const generatedContents = await getGeneratedGalleryContents({
        exampleName,
    });
    const { entryFileName, files = {} } = generatedContents || {};
    const { [entryFileName!]: entryFile, ...otherFiles } = files;
    const { code } = transformPlainEntryFile(entryFile, files['data.js']);
    // Replace entry file with plain one
    const plainScriptFiles = generatedContents?.scriptFiles
        .filter((fileName) => {
            return fileName !== entryFileName;
        })
        .concat(PLAIN_ENTRY_FILE_NAME);
    const plainFiles = {
        ...otherFiles,
        [PLAIN_ENTRY_FILE_NAME]: code,
    };

    return {
        ...generatedContents,
        scriptFiles: plainScriptFiles,
        files: plainFiles,
    };
};
