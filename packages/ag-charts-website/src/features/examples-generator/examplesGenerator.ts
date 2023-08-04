import { getEntryFileName, getIsEnterprise, getTransformTsFileExt, getFileContents } from './utils/fileUtils';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import fs from 'node:fs/promises';
import { getOtherScriptFiles } from './utils/getOtherScriptFiles';
import { getStyleFiles } from './utils/getStyleFiles';
import type { InternalFramework } from '@ag-grid-types';
import { frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
import type { GeneratedContents } from './types.d';
import { SOURCE_ENTRY_FILE_NAME } from './constants';

/**
 * Get the file list of the generated contents
 * (without generating the contents)
 */
export const getGeneratedContentsFileList = async ({
    internalFramework,
    folderUrl,
}: {
    internalFramework: InternalFramework;
    folderUrl: URL;
}): Promise<string[]> => {
    const entryFileName = getEntryFileName(internalFramework)!;
    const sourceFileList = await fs.readdir(folderUrl);

    const scriptFiles = await getOtherScriptFiles({
        folderUrl,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({
        folderUrl,
        sourceFileList,
    });

    const generatedFileList = ['index.html', entryFileName]
        .concat(Object.keys(scriptFiles))
        .concat(Object.keys(styleFiles));

    return generatedFileList;
};

/**
 * Get generated contents for an example
 */
export const getGeneratedContents = async ({
    internalFramework,
    folderUrl,
}: {
    internalFramework: InternalFramework;
    folderUrl: URL;
}): Promise<GeneratedContents | undefined> => {
    const sourceFileList = await fs.readdir(folderUrl);

    const sourceEntryFileName = SOURCE_ENTRY_FILE_NAME;
    const entryFile = await getFileContents({
        folderUrl,
        fileName: sourceEntryFileName,
    }).catch(() => {}); // Fail silently

    if (!entryFile) {
        return;
    }

    const indexHtml = await getFileContents({
        folderUrl,
        fileName: 'index.html',
    });

    const otherScriptFiles = await getOtherScriptFiles({
        folderUrl,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({
        folderUrl,
        sourceFileList,
    });

    const isEnterprise = getIsEnterprise({
        internalFramework,
        entryFile,
    });

    const { bindings, typedBindings } = chartVanillaSrcParser({
        srcFile: entryFile,
        html: indexHtml,
        exampleSettings: {
            enterprise: isEnterprise,
        },
    });

    const getFrameworkFiles = frameworkFilesGenerator[internalFramework];
    if (!getFrameworkFiles) {
        throw new Error(`No entry file config generator for '${internalFramework}'`);
    }

    const { files, boilerPlateFiles, scriptFiles, entryFileName } = await getFrameworkFiles({
        entryFile,
        indexHtml,
        isEnterprise,
        bindings,
        typedBindings,
        otherScriptFiles,
    });
    const contents: GeneratedContents = {
        isEnterprise,
        scriptFiles: scriptFiles!,
        styleFiles: Object.keys(styleFiles),
        sourceFileList,
        files: Object.assign(styleFiles, files),
        boilerPlateFiles: boilerPlateFiles!,
        entryFileName,
    };

    return contents;
};
