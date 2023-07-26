import fs from 'node:fs/promises';
import { getIsDev } from '../../../utils/env';
import { getFolders } from '../../../utils/fs';
import type { Framework, InternalFramework } from '../../../types/ag-grid.d';
import { pathJoin } from '../../../utils/pathJoin';
import { isTypescriptInternalFramework } from '../../../utils/pages';
import type { TransformTsFileExt } from '../types';

export const getContentRootFileUrl = (): URL => {
    const contentRoot = getIsDev()
        ? // Relative to the folder of this file
          '../../../content'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../packages/ag-charts-website/src/content';
    return new URL(contentRoot, import.meta.url);
};

/**
 * The root of the `ag-charts-website` package
 */
const getBoilerPlateFilesUrl = () => {
    const packagePath = getIsDev()
        ? // Relative to the folder of this file
          '../../../../public/example-runner'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../example-runner'; // NOTE: No `public` folder
    return new URL(packagePath, import.meta.url);
};

export const getBoilerPlateName = (internalFramework: InternalFramework) => {
    const boilerPlateTemplate = (boilerPlateKey: string) => `charts-${boilerPlateKey}-boilerplate`;

    switch (internalFramework) {
        case 'react':
        case 'reactFunctional':
            return boilerPlateTemplate('react');
        case 'reactFunctionalTs':
            return boilerPlateTemplate('react-ts');
        case 'typescript':
        case 'angular':
        case 'vue':
        case 'vue3':
            return boilerPlateTemplate(internalFramework);
        default:
            return undefined;
    }
};

export const getTransformTsFileExt = (internalFramework: InternalFramework): TransformTsFileExt => {
    let transformTsFileExt;
    if (internalFramework === 'reactFunctionalTs') {
        transformTsFileExt = '.tsx';
    } else if (!isTypescriptInternalFramework(internalFramework)) {
        transformTsFileExt = '.js';
    }

    return transformTsFileExt;
};

export const getBoilerPlateFiles = async (internalFramework: InternalFramework) => {
    const boilerPlateFilesPath = getBoilerPlateFilesUrl();
    const boilerplateName = getBoilerPlateName(internalFramework);

    if (!boilerplateName) {
        return {};
    }
    const boilerPlatePath = pathJoin(boilerPlateFilesPath.pathname, boilerplateName);

    const fileNames = await fs.readdir(boilerPlatePath);

    const files: Record<string, string> = {};
    const isDev = getIsDev();
    const fileContentPromises = fileNames.map(async (fileName) => {
        if (!isDev && fileName === 'systemjs.config.dev.js') {
            // Ignore systemjs dev file if on production
            return;
        }
        const filePath = pathJoin(boilerPlatePath, fileName);
        const contents = await fs.readFile(filePath, 'utf-8').catch(() => {
            return undefined;
        });
        if (contents) {
            files[fileName] = contents;
        }
    });
    await Promise.all(fileContentPromises);

    return files;
};

export const getAllSourceExampleFileList = async () => {
    const contentRoot = getContentRootFileUrl();
    const pagesFolder = pathJoin(contentRoot.pathname, 'docs');
    const pages = await fs.readdir(pagesFolder);

    const examplesPromises = pages.map(async (pageName) => {
        const examplesFolder = pathJoin(pagesFolder, pageName, '_examples');
        const examples = await getFolders(examplesFolder);

        return examples.map((file) => {
            return pathJoin(examplesFolder, file);
        });
    });
    const exampleFolders = (await Promise.all(examplesPromises)).flat();

    const exampleFilesPromises = exampleFolders.map(async (exampleFolder) => {
        const exampleFiles = await fs.readdir(exampleFolder);
        return exampleFiles.map((exampleFile) => {
            return pathJoin(exampleFolder, exampleFile);
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles;
};

export const getSourceExamplesPathUrl = ({ pageName }: { pageName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const examplesFolderPath = pathJoin('docs', pageName, '_examples');
    const sourceExamplesPath = pathJoin(contentRoot.pathname, examplesFolderPath);
    return new URL(sourceExamplesPath, import.meta.url);
};

export const getFrameworkFromInternalFramework = (internalFramework: InternalFramework) => {
    switch (internalFramework) {
        case 'typescript':
        case 'vanilla':
            return 'javascript';
        case 'react':
        case 'reactFunctionalTs':
        case 'reactFunctional':
            return 'react';
        case 'vue':
        case 'vue3':
            return 'vue';
        default:
            return internalFramework;
    }
};

export const getEntryFileName = (internalFramework: InternalFramework) => {
    switch (internalFramework) {
        case 'typescript':
            return 'main.ts';
        case 'react':
        case 'reactFunctional':
            return 'index.jsx';
        case 'reactFunctionalTs':
            return 'index.tsx';
        case 'vanilla':
        case 'angular':
        case 'vue':
        case 'vue3':
            return 'main.js';
        default:
            return;
    }
};

export const getSourceFolderUrl = ({ pageName, exampleName }: { pageName: string; exampleName: string }) => {
    const examplesFolderPath = getSourceExamplesPathUrl({
        pageName,
    }).pathname;
    const exampleFolderPath = pathJoin(examplesFolderPath, exampleName);

    return new URL(exampleFolderPath, import.meta.url);
};

export const getSourceFileUrl = ({
    pageName,
    exampleName,
    fileName,
}: {
    pageName: string;
    exampleName: string;
    fileName: string;
}) => {
    const exampleFolderPath = getSourceFolderUrl({
        pageName,
        exampleName,
    }).pathname;
    const entryFilePath = pathJoin(exampleFolderPath, fileName);

    return new URL(entryFilePath, import.meta.url);
};

export const getSourceFileContents = ({
    pageName,
    exampleName,
    fileName,
}: {
    pageName: string;
    exampleName: string;
    fileName: string;
}): Promise<string | undefined> => {
    const entryFileUrl = getSourceFileUrl({
        pageName,
        exampleName,
        fileName,
    });
    return fs.readFile(entryFileUrl, 'utf-8').catch(() => {
        return undefined;
    });
};

// TODO: Find a better way to determine if an example is enterprise or not
export const getIsEnterprise = ({
    internalFramework,
    entryFile,
}: {
    internalFramework: InternalFramework;
    entryFile: string;
}) => {
    const entryFileName = getEntryFileName(internalFramework);

    return entryFileName === 'main.js'
        ? entryFile?.includes('AgEnterpriseCharts')
        : entryFile?.includes('ag-charts-enterprise');
};

export const getContentsOfFileList = async ({
    pageName,
    exampleName,
    fileList,
}: {
    pageName: string;
    exampleName: string;
    fileList: string[];
}) => {
    const contentFiles = {} as Record<string, string>;
    await Promise.all(
        fileList.map(async (fileName) => {
            const file = (await getSourceFileContents({
                pageName,
                exampleName,
                fileName,
            })) as string;
            if (file) {
                contentFiles[fileName] = file;
            }
        })
    );

    return contentFiles;
};
