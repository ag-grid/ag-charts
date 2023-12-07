import { getGeneratedContents } from '../../example-generator';
import { GALLERY_INTERNAL_FRAMEWORK, PLAIN_ENTRY_FILE_NAME } from '../constants';
import { transformPlainEntryFile } from './transformPlainEntryFile';

export const getGeneratedPlainGalleryContents = async ({ exampleName }: { exampleName: string }) => {
    const generatedContents = await getGeneratedContents({
        type: 'gallery',
        framework: GALLERY_INTERNAL_FRAMEWORK,
        exampleName,
        ignoreDarkMode: true,
    });

    const { entryFileName, files = {} } = generatedContents || {};
    const { [entryFileName!]: entryFile, ...otherFiles } = files;
    const { code } = transformPlainEntryFile(entryFile, files['data.js']);
    // Replace entry file with plain one
    const plainScriptFiles = generatedContents?.scriptFiles
        .filter((fileName) => fileName !== entryFileName)
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
