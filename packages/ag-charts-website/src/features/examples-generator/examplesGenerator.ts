import type { InternalFramework } from '@ag-grid-types';
import fs from 'node:fs/promises';

import { ANGULAR_GENERATED_MAIN_FILE_NAME, SOURCE_ENTRY_FILE_NAME } from './constants';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import type { GeneratedContents } from './types.d';
import { getEntryFileName, getFileContents, getIsEnterprise, getTransformTsFileExt } from './utils/fileUtils';
import { frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
import { getOtherScriptFiles } from './utils/getOtherScriptFiles';
import { getStyleFiles } from './utils/getStyleFiles';

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
    // Angular is a special case where the `main.ts` entry file is a boilerplate file
    // and another file is generated from the source file `main.ts`.
    // Both the boilerplate entry file and the generated file need to
    // be added to the generated file list
    const angularFiles = internalFramework === 'angular' ? [ANGULAR_GENERATED_MAIN_FILE_NAME] : [];

    const generatedFileList = ['index.html', entryFileName]
        .concat(angularFiles)
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
    ignoreDarkMode,
}: {
    internalFramework: InternalFramework;
    folderUrl: URL;
    ignoreDarkMode?: boolean;
}): Promise<GeneratedContents | undefined> => {
    const sourceFileList = await fs.readdir(folderUrl);

    const entryFile = await getFileContents({ folderUrl, fileName: SOURCE_ENTRY_FILE_NAME }).catch(() => {}); // Fail silently

    if (!entryFile) {
        return;
    }

    const indexHtml = await getFileContents({ folderUrl, fileName: 'index.html' });

    const otherScriptFiles = await getOtherScriptFiles({
        folderUrl,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({ folderUrl, sourceFileList });

    const isEnterprise = getIsEnterprise({ entryFile });

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

    const { files, boilerPlateFiles, scriptFiles, entryFileName, mainFileName } = await getFrameworkFiles({
        entryFile,
        indexHtml,
        isEnterprise,
        bindings,
        typedBindings,
        otherScriptFiles,
        ignoreDarkMode,
    });

    return {
        isEnterprise,
        scriptFiles: scriptFiles!,
        styleFiles: Object.keys(styleFiles),
        sourceFileList,
        files: Object.assign(styleFiles, files),
        boilerPlateFiles: boilerPlateFiles!,
        entryFileName,
        mainFileName,
    };
};
