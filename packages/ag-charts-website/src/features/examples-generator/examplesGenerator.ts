import {
    getEntryFileName,
    getSourceFileContents,
    getFrameworkFromInternalFramework,
    getIsEnterprise,
    getSourceFolderUrl,
} from './utils/fileUtils';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import fs from 'node:fs/promises';
import { getOtherScriptFiles, type FileContents } from './utils/getOtherScriptFiles';
import { getStyleFiles } from './utils/getStyleFiles';
import type { InternalFramework } from '../../types/ag-grid';
import { frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
interface GeneratedContents {
    files: FileContents;
    entryFileName: string;
    scriptFiles: string[];
    styleFiles: string[];
    isEnterprise: boolean;
    sourceFileList: string[];
}

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
    const framework = getFrameworkFromInternalFramework(internalFramework);
    const entryFileName = getEntryFileName({ framework, internalFramework });
    const sourceFolderUrl = getSourceFolderUrl({
        pageName,
        exampleName,
    });
    const sourceFileList = await fs.readdir(sourceFolderUrl);
    const scriptFiles = await getOtherScriptFiles({
        sourceEntryFileName: entryFileName,
        sourceFileList,
        pageName,
        exampleName,
    });
    const styleFiles = await getStyleFiles({
        sourceFileList,
        pageName,
        exampleName,
    });

    let generatedFileList = Object.keys(scriptFiles).concat(Object.keys(styleFiles));
    if (internalFramework === 'vanilla') {
        generatedFileList = generatedFileList.concat(['index.html']);
    } else if (internalFramework === 'typescript') {
        generatedFileList = generatedFileList.concat(['main.ts', 'index.html']);
    } else if (internalFramework === 'react') {
        generatedFileList = generatedFileList.concat('index.jsx');
    } else {
        // HACK: Use react for the rest of the other frameworks for now
        generatedFileList = generatedFileList.concat('index.jsx');
    }

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
    const framework = getFrameworkFromInternalFramework(internalFramework);
    const sourceFolderUrl = getSourceFolderUrl({
        pageName,
        exampleName,
    });
    const sourceFileList = await fs.readdir(sourceFolderUrl);

    const sourceEntryFileName = 'main.ts';
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

    const { bindings, typedBindings } = chartVanillaSrcParser({
        srcFile: entryFile,
        html: indexHtml,
        exampleSettings: {},
    });

    const isEnterprise = getIsEnterprise({
        framework,
        internalFramework,
        entryFile,
    });

    const otherScriptFiles = await getOtherScriptFiles({
        sourceEntryFileName,
        sourceFileList,
        pageName,
        exampleName,
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

    const { files, scriptFiles, entryFileName } = getFrameworkFiles({
        entryFile,
        indexHtml,
        isEnterprise,
        bindings,
        typedBindings,
    });
    const contents: GeneratedContents = {
        isEnterprise,
        scriptFiles: Object.keys(otherScriptFiles).concat(scriptFiles),
        styleFiles: Object.keys(styleFiles),
        sourceFileList,
        files: Object.assign(otherScriptFiles, styleFiles, files),
        entryFileName,
    } as GeneratedContents;

    return contents;
};
