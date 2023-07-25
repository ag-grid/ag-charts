import {
    getEntryFileName,
    getSourceFileContents,
    getFrameworkFromInternalFramework,
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
    const entryFileName = getEntryFileName(internalFramework);
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
        transformTsFileExt: getTransformTsFileExt(internalFramework),
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
    } else if (internalFramework === 'react' || internalFramework === 'reactFunctional') {
        generatedFileList = generatedFileList.concat('index.jsx');
    } else if (internalFramework === 'reactFunctionalTs') {
        generatedFileList = generatedFileList.concat('index.tsx');
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
        sourceEntryFileName,
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
