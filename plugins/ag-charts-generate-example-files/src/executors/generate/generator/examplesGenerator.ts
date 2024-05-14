import fs from 'fs/promises';
import path from 'path';

import { readFile } from '../../../executors-utils';
import { ANGULAR_GENERATED_MAIN_FILE_NAME, SOURCE_ENTRY_FILE_NAME } from './constants';
import { transformPlainEntryFile } from './transformPlainEntryFile';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import type { GeneratedContents, InternalFramework } from './types';
import {
    getEntryFileName,
    getIsEnterprise,
    getProvidedExampleFiles,
    getProvidedExampleFolder,
    getTransformTsFileExt,
} from './utils/fileUtils';
import { frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
import { getDarkModeSnippet } from './utils/getDarkModeSnippet';
import { getOtherScriptFiles } from './utils/getOtherScriptFiles';
import { getPackageJson } from './utils/getPackageJson';
import { getStyleFiles } from './utils/getStyleFiles';

type FileListParams = {
    internalFramework: InternalFramework;
    folderPath: string;
};

const PLACEHOLDER_MAIN_TS = `
import { AgCharts } from 'ag-charts-community';

const options = {
    container: document.getElementById('myChart'),
    title: { text: 'Frameworks not supported' },
    subtitle: { text: 'Switch to Javascript' },
};

const chart = AgCharts.create(options);
`;

/**
 * Get the file list of the generated contents
 * (without generating the contents)
 */
export const getGeneratedContentsFileList = async (params: FileListParams): Promise<string[]> => {
    const { internalFramework, folderPath } = params;

    const entryFileName = getEntryFileName(internalFramework)!;
    const sourceFileList = await fs.readdir(folderPath);

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
    extractOptions?: boolean;
};

/**
 * Get generated contents for an example
 */
export const getGeneratedContents = async (params: GeneratedContentParams): Promise<GeneratedContents | undefined> => {
    const { internalFramework, folderPath, ignoreDarkMode, isDev = false } = params;
    let { extractOptions = false } = params;
    const sourceFileList = await fs.readdir(folderPath);

    if (!sourceFileList.includes(SOURCE_ENTRY_FILE_NAME)) {
        throw new Error('Unable to find example entry-point at: ' + folderPath);
    }

    let entryFile = await readFile(path.join(folderPath, SOURCE_ENTRY_FILE_NAME));
    let indexHtml = await readFile(path.join(folderPath, 'index.html'));
    extractOptions ||= entryFile.includes('@ag-options-extract');

    if (entryFile.includes('@ag-skip-fws') && internalFramework !== 'vanilla') {
        entryFile = PLACEHOLDER_MAIN_TS;
        indexHtml = `<div id="myChart"></div>`;
        extractOptions = false;
    }

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
    const mainEntryFilename = getEntryFileName(internalFramework);
    const providedExampleEntries = await Promise.all(
        providedExampleFileNames.map(async (fileName) => {
            let contents = (await fs.readFile(path.join(providedExampleBasePath, fileName))).toString('utf-8');

            if (fileName === mainEntryFilename && !ignoreDarkMode) {
                contents = contents + '\n' + getDarkModeSnippet();
            }

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
    const packageJson = getPackageJson({
        isEnterprise,
        internalFramework,
    });

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

    if (internalFramework === 'vanilla' && ignoreDarkMode === true && extractOptions) {
        const { optionsById } = transformPlainEntryFile(files[entryFileName], [files['data.js']]);

        const jsonOptions = {};
        for (const [id, options] of optionsById) {
            jsonOptions[id] = options;
        }

        // NOTE: This works well for static options structures where JSON.stringify() is sufficient,
        // but doesn't support cases using callback functions.
        //
        // The NPM package `serialize-javascript` can deal with trivial cases, but non-trivial cases
        // such as a callback that uses another function declared in the example are not handled well.
        files['_options.json'] = JSON.stringify(jsonOptions);
    }

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
        packageJson,
    };

    return result;
};
