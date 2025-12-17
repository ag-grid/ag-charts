import { readFile } from 'ag-shared/plugin-utils';
import fs from 'fs/promises';
import path from 'path';

import { ANGULAR_GENERATED_MAIN_FILE_NAME, SOURCE_ENTRY_FILE_NAME } from './constants';
import { transformPlainEntryFile } from './transformPlainEntryFile';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import type { GeneratedContents, InternalFramework } from './types';
import { benchmarkRunner } from './utils/benchmarkRunner';
import {
    getEntryFileName,
    getHasBenchmarkConfig,
    getHasExampleConsoleLog,
    getHasExampleControls,
    getHasLocale,
    getIsEnterprise,
    getProvidedExampleFiles,
    getProvidedExampleFolder,
    getTransformTsFileExt,
} from './utils/fileUtils';
import { type TransformEntryFile, frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
import { getBenchmarkSnippet } from './utils/getBenchmarkSnippet';
import { getConsoleLogSnippet } from './utils/getConsoleLogSnippet';
import { getDarkModeSnippet } from './utils/getDarkModeSnippet';
import { getExampleConfig } from './utils/getExampleConfig';
import { getHtmlFiles } from './utils/getHtmlFiles';
import { getOtherScriptFiles } from './utils/getOtherScriptFiles';
import { getPackageJson } from './utils/getPackageJson';
import { filterStyleFiles, getStyleFiles } from './utils/getStyleFiles';

type FileListParams = {
    internalFramework: InternalFramework;
    folderPath: string;
    isDev: boolean;
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

const getExampleFolderParts = ({ exampleFolder }: { exampleFolder: string }) => {
    const folders = exampleFolder.split('/');
    const pageName = folders[folders.length - 3];
    const exampleName = folders[folders.length - 1];

    return {
        pageName,
        exampleName,
    };
};

/**
 * Get the file list of the generated contents
 * (without generating the contents)
 */
export const getGeneratedContentsFileList = async (params: FileListParams): Promise<string[]> => {
    const { internalFramework, folderPath, isDev } = params;

    const entryFileName = getEntryFileName(internalFramework);
    const sourceFileList = await fs.readdir(folderPath);

    const scriptFiles = await getOtherScriptFiles({
        folderPath,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
        isDev,
    });
    const styleFiles = await getStyleFiles({
        internalFramework,
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
    const { internalFramework, folderPath, ignoreDarkMode, isDev } = params;
    let { extractOptions = false } = params;
    const { pageName, exampleName } = getExampleFolderParts({ exampleFolder: folderPath });

    if (!pageName || !exampleName) {
        throw new Error('Invalid example folder path: ' + folderPath);
    }

    const sourceFileList = await fs.readdir(folderPath);

    if (!sourceFileList.includes(SOURCE_ENTRY_FILE_NAME)) {
        throw new Error('Unable to find example entry-point at: ' + folderPath);
    }

    let entryFile = await readFile(path.join(folderPath, SOURCE_ENTRY_FILE_NAME));
    let indexHtml = await readFile(path.join(folderPath, 'index.html'));
    extractOptions ||= entryFile.includes('@ag-options-extract');
    let suppressOptionsClone = false;

    if (entryFile.includes('@ag-skip-fws')) {
        if (['vanilla'].includes(internalFramework)) {
            entryFile = entryFile.replace(/^\s*\/\/ @ag-skip-fws\s*\n*$/g, '');
        } else {
            entryFile = PLACEHOLDER_MAIN_TS;
            indexHtml = `<div id="myChart"></div>`;
            extractOptions = false;
        }
    }

    let skipContainerCheck = false;
    if (entryFile.includes('@ag-skip-container-check')) {
        entryFile = entryFile.replace(/^\s*\/\/ @ag-skip-container-check\s*\n*$/g, '');
        skipContainerCheck = true;
    }

    if (entryFile.includes('@ag-skip-clone')) {
        entryFile = entryFile.replace(/^\s*\/\/ @ag-skip-clone\s*\n*$/g, '');
        suppressOptionsClone = true;
    }

    const transformEntryFile: TransformEntryFile = ({ entryFile, chartAPI }) => {
        let transformedEntryFile = entryFile;
        // Add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            transformedEntryFile = transformedEntryFile + '\n' + getDarkModeSnippet({ chartAPI });
        }

        if (hasExampleConsoleLog) {
            transformedEntryFile =
                transformedEntryFile + '\n' + getConsoleLogSnippet({ pageName, exampleName, logError: isDev });
        }

        // Add benchmark loader snippet if getBenchmarkConfig() is detected
        if (hasBenchmarkConfig) {
            transformedEntryFile = transformedEntryFile + '\n' + getBenchmarkSnippet();
        }

        return transformedEntryFile;
    };

    const otherScriptFiles = await getOtherScriptFiles({
        folderPath,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
        isDev,
    });
    const providedExampleFileNames = getProvidedExampleFiles({ folderPath, internalFramework });

    const providedExampleBasePath = getProvidedExampleFolder({
        folderPath,
        internalFramework,
    });
    const hasExampleConsoleLog = getHasExampleConsoleLog({ contents: entryFile });
    const hasExampleControls = getHasExampleControls({ contents: indexHtml });
    const hasBenchmarkConfig = getHasBenchmarkConfig({ entryFile });
    const mainEntryFilename = getEntryFileName(internalFramework);
    const providedExampleEntries = await Promise.all(
        providedExampleFileNames.map(async (fileName) => {
            let contents = (await fs.readFile(path.join(providedExampleBasePath, fileName))).toString('utf-8');

            if (fileName === mainEntryFilename) {
                contents = transformEntryFile({ entryFile: contents });
            }

            return [fileName, contents];
        })
    );
    const providedExamples = Object.fromEntries(providedExampleEntries);

    const styleFiles = await getStyleFiles({ internalFramework, folderPath, sourceFileList });
    const htmlFiles = await getHtmlFiles({ folderPath, sourceFileList });

    const isEnterprise = getIsEnterprise({ entryFile });
    const hasLocale = getHasLocale({ entryFile });
    const exampleConfig = await getExampleConfig({ folderPath, sourceFileList });

    const { bindings, typedBindings } = chartVanillaSrcParser({
        srcFile: entryFile,
        html: indexHtml,
        dirPath: folderPath,
        exampleSettings: {
            enterprise: isEnterprise,
            skipContainerCheck,
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

    const styleFileNames = filterStyleFiles(sourceFileList);
    const { files, boilerPlateFiles, scriptFiles, entryFileName, mainFileName } = await getFrameworkFiles({
        entryFile,
        indexHtml,
        isEnterprise,
        bindings,
        typedBindings,
        otherScriptFiles,
        styleFileNames,
        transformEntryFile,
        isDev,
        suppressOptionsClone,
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

    // Add benchmark.js if getBenchmarkConfig() is detected
    if (hasBenchmarkConfig) {
        files['benchmark.js'] = benchmarkRunner;
    }

    const result: GeneratedContents = {
        isEnterprise,
        hasLocale,
        hasExampleConsoleLog,
        hasExampleControls,
        hasBenchmarkConfig,
        exampleConfig,
        scriptFiles,
        styleFiles: Object.keys(styleFiles),
        htmlFiles: Object.keys(htmlFiles),
        sourceFileList,
        // Replace files with provided examples
        files: Object.assign(styleFiles, htmlFiles, files, providedExamples),
        // Files without provided examples
        generatedFiles: files,
        boilerPlateFiles,
        providedExamples,
        entryFileName,
        mainFileName,
        packageJson,
    };

    return result;
};
