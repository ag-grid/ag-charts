import {
    getEntryFileName,
    getSourceFileContents,
    getIsEnterprise,
    getSourceFolderUrl,
    getTransformTsFileExt,
} from './utils/fileUtils';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import fs from 'node:fs/promises';
import { getOtherScriptFiles } from './utils/getOtherScriptFiles';
import { getStyleFiles } from './utils/getStyleFiles';
import type { InternalFramework } from '../../types/ag-grid';
import { frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
import type { GeneratedContents } from './types.d';
import { SOURCE_ENTRY_FILE_NAME } from './constants';

/**
 * Get the file list of the generated contents
 * (without generating the contents)
 */
export const getGeneratedContentsFileList = async ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}): Promise<string[]> => {
    const entryFileName = getEntryFileName(internalFramework)!;
    const sourceFolderUrl = getSourceFolderUrl({
        pageName,
        exampleName,
    });
    const sourceFileList = await fs.readdir(sourceFolderUrl);

    const scriptFiles = await getOtherScriptFiles({
        sourceFileList,
        pageName,
        exampleName,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({
        sourceFileList,
        pageName,
        exampleName,
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
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}): Promise<GeneratedContents | undefined> => {
    const sourceFolderUrl = getSourceFolderUrl({
        pageName,
        exampleName,
    });
    const sourceFileList = await fs.readdir(sourceFolderUrl);

    const sourceEntryFileName = SOURCE_ENTRY_FILE_NAME;
    const entryFile = await getSourceFileContents({
        pageName,
        exampleName,
        fileName: sourceEntryFileName,
    });
    const indexHtml = (await getSourceFileContents({
        pageName,
        exampleName,
        fileName: 'index.html',
    })) as string;

    if (!entryFile) {
        return;
    }

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

    const otherScriptFiles = await getOtherScriptFiles({
        sourceFileList,
        pageName,
        exampleName,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({
        sourceFileList,
        pageName,
        exampleName,
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
        scriptFiles,
        styleFiles: Object.keys(styleFiles),
        sourceFileList,
        files: Object.assign(styleFiles, files),
        boilerPlateFiles,
        entryFileName,
    } as GeneratedContents;

    return contents;
};
