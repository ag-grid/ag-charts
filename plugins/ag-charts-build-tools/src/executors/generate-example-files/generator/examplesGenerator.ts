import fs from 'fs';
import path from 'path';

import { readFile } from '../../../executors-utils';
import { ANGULAR_GENERATED_MAIN_FILE_NAME, SOURCE_ENTRY_FILE_NAME } from './constants';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import type { InternalFramework } from './types';
import type { GeneratedContents } from './types';
import {
    getEntryFileName,
    getIsEnterprise,
    getProvidedExampleFiles,
    getProvidedExampleFolder,
    getTransformTsFileExt,
} from './utils/fileUtils';
import { frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
import { getOtherScriptFiles } from './utils/getOtherScriptFiles';
import { getStyleFiles } from './utils/getStyleFiles';

type FileListParams = {
    internalFramework: InternalFramework;
    folderPath: string;
};

/**
 * Get the file list of the generated contents
 * (without generating the contents)
 */
export const getGeneratedContentsFileList = async (params: FileListParams): Promise<string[]> => {
    const { internalFramework, folderPath } = params;

    const entryFileName = getEntryFileName(internalFramework)!;
    const sourceFileList = await fs.readdirSync(folderPath);

    const scriptFiles = await getOtherScriptFiles({
        folderPath,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({
        folderPath,
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

type GeneratedContentParams = {
    internalFramework: InternalFramework;
    folderPath: string;
    ignoreDarkMode?: boolean;
    isDev?: boolean;
};

/**
 * Get generated contents for an example
 */
export const getGeneratedContents = async (params: GeneratedContentParams): Promise<GeneratedContents | undefined> => {
    const { internalFramework, folderPath, ignoreDarkMode, isDev = false } = params;
    const sourceFileList = await fs.readdirSync(folderPath);

    if (!sourceFileList.includes(SOURCE_ENTRY_FILE_NAME)) {
        throw new Error('Unable to find example entry-point at: ' + folderPath);
    }

    const entryFile = readFile(path.join(folderPath, SOURCE_ENTRY_FILE_NAME));
    const indexHtml = readFile(path.join(folderPath, 'index.html'));

    const otherScriptFiles = await getOtherScriptFiles({
        folderPath,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const providedExampleFileNames = getProvidedExampleFiles({ folderPath, internalFramework });

    const providedExampleBasePath = getProvidedExampleFolder({
        folderPath,
        internalFramework,
    });
    const providedExampleEntries = await Promise.all(
        providedExampleFileNames.map(async (fileName) => {
            const contents = fs.readFileSync(path.join(providedExampleBasePath, fileName));

            return [fileName, contents];
        })
    );
    const providedExamples = Object.fromEntries(providedExampleEntries);

    const styleFiles = await getStyleFiles({ folderPath, sourceFileList });

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
        isDev,
    });

    const result: GeneratedContents = {
        isEnterprise,
        scriptFiles: scriptFiles!,
        styleFiles: Object.keys(styleFiles),
        sourceFileList,
        // Replace files with provided examples
        files: Object.assign(styleFiles, files, providedExamples),
        // Files without provided examples
        generatedFiles: files,
        boilerPlateFiles: boilerPlateFiles!,
        providedExamples,
        entryFileName,
        mainFileName,
    };

    return result;
};
