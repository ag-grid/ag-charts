import type { InternalFramework } from '@ag-grid-types';
import { getIsDev } from '@utils/env';
import { isTypescriptInternalFramework } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';

import type { TransformTsFileExt } from '../types';

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
    let transformTsFileExt: TransformTsFileExt;
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

export const getFrameworkFromInternalFramework = (internalFramework: InternalFramework) => {
    switch (internalFramework) {
        case 'typescript':
        case 'vanilla':
            return 'javascript';
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

/**
 * Entry filename to execute code
 */
export const getEntryFileName = (internalFramework: InternalFramework) => {
    switch (internalFramework) {
        case 'typescript':
        case 'angular':
            return 'main.ts';
        case 'reactFunctional':
            return 'index.jsx';
        case 'reactFunctionalTs':
            return 'index.tsx';
        case 'vanilla':
        case 'vue':
        case 'vue3':
            return 'main.js';
        default:
            return;
    }
};

/**
 * Main filename showing code that is run
 */
export const getMainFileName = (internalFramework: InternalFramework) => {
    switch (internalFramework) {
        case 'angular':
            return 'app.component.ts';
        default:
            return getEntryFileName(internalFramework);
    }
};

export const getFileContents = ({ folderUrl, fileName }: { folderUrl: URL; fileName: string }) => {
    const filePath = pathJoin(folderUrl.pathname, fileName);

    return fs.readFile(filePath, 'utf-8');
};

export const getProvidedExampleFolder = ({
    folderUrl,
    internalFramework,
}: {
    folderUrl: URL;
    internalFramework: InternalFramework;
}) => {
    return new URL(pathJoin(folderUrl, 'provided/modules', internalFramework));
};

export const getProvidedExampleFiles = ({
    folderUrl,
    internalFramework,
}: {
    folderUrl: URL;
    internalFramework: InternalFramework;
}) => {
    const providedFolder = getProvidedExampleFolder({ folderUrl, internalFramework });

    return existsSync(providedFolder) ? fs.readdir(providedFolder) : [];
};

export const getFileList = async ({ folderUrl, fileList }: { folderUrl: URL; fileList: string[] }) => {
    const contentFiles = {} as Record<string, string>;
    await Promise.all(
        fileList.map(async (fileName) => {
            const file = await getFileContents({
                folderUrl,
                fileName,
            });
            if (file) {
                contentFiles[fileName] = file;
            }
        })
    );

    return contentFiles;
};

// TODO: Find a better way to determine if an example is enterprise or not
export const getIsEnterprise = ({ entryFile }: { entryFile: string }) => entryFile?.includes('ag-charts-enterprise');
