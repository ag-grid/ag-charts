import type { InternalFramework, Library } from '@ag-grid-types';
import type { CollectionEntry } from 'astro:content';
import fs from 'fs/promises';
import glob from 'glob';

import { DEV_FILE_BASE_PATH, SITE_BASE_URL, TYPESCRIPT_INTERNAL_FRAMEWORKS } from '../constants';
import { getIsDev } from './env';
import { pathJoin } from './pathJoin';
import { urlWithBaseUrl } from './urlWithBaseUrl';

export type DocsPage =
    | CollectionEntry<'docs'>
    | {
          slug: string;
      };

export interface InternalFrameworkExample {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

export interface DevFileRoute {
    params: {
        filePath: string;
    };
    props: {
        fullFilePath: string;
    };
}

/**
 * Mapping for dev files, from route to file path
 *
 * NOTE: File path is after `getRootUrl()`
 */
export const DEV_FILE_PATH_MAP: Record<string, string> = {
    'resolved-interfaces.json': 'dist/packages/ag-charts-community/resolved-interfaces.AUTO.json',

    'ag-charts-community/dist/**': 'packages/ag-charts-community/dist/**/*.{cjs,js,map}',
    'ag-charts-enterprise/dist/**': 'packages/ag-charts-enterprise/dist/**/*.{cjs,js,map}',
    'ag-charts-react/main.js': 'packages/ag-charts-react/dist/index.cjs.js',

    'ag-charts-vue/main.js': 'packages/ag-charts-vue/main.js',
    'ag-charts-vue/lib/AgChartsVue.js': 'packages/ag-charts-vue/lib/AgChartsVue.js',
    'ag-charts-vue3/lib/AgChartsVue.js': 'packages/ag-charts-vue3/lib/AgChartsVue.js',

    'ag-charts-angular/fesm2015/ag-charts-angular.mjs':
        'packages/ag-charts-angular/dist/ag-charts-angular/fesm2015/ag-charts-angular.mjs',
};

export const getPublicFileUrl = ({ isDev = getIsDev() }: { isDev?: boolean } = { isDev: getIsDev() }): URL => {
    const contentRoot = isDev
        ? // Relative to the folder of this file
          '../../public'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../packages/ag-charts-website/public';
    return new URL(contentRoot, import.meta.url);
};

export const getContentRootFileUrl = ({ isDev = getIsDev() }: { isDev?: boolean } = { isDev: getIsDev() }): URL => {
    const contentRoot = isDev
        ? // Relative to the folder of this file
          '../content'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../packages/ag-charts-website/src/content';
    return new URL(contentRoot, import.meta.url);
};

export const getDebugFolderUrl = ({ isDev = getIsDev() }: { isDev?: boolean } = { isDev: getIsDev() }): URL => {
    const contentRoot = isDev
        ? // Relative to the folder of this file
          '../pages/debug'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../packages/ag-charts-website/src/pages/debug';
    return new URL(contentRoot, import.meta.url);
};

export const getDebugPageUrls = async ({
    allFiles,
}: {
    /**
     * Get all files, by default only returns `.astro` pages
     */
    allFiles?: boolean;
} = {}) => {
    const debugFolder = getDebugFolderUrl();
    const pages = await fs.readdir(debugFolder);
    const filteredPages = allFiles
        ? pages
        : pages.filter((pageName) => {
              return pageName.match(/\.astro$/);
          });

    const pagePathPromises = filteredPages
        .map(async (pageName) => {
            const pageNameWithoutExt = pageName.replace(/\.[^.]+$/, '');
            return urlWithBaseUrl(pathJoin('/debug', pageNameWithoutExt));
        })
        .flat();

    return Promise.all(pagePathPromises);
};

/**
 * The root url where the monorepo exists
 */
const getRootUrl = (): URL => {
    const root = getIsDev()
        ? // Relative to the folder of this file
          '../../../../'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../';
    return new URL(root, import.meta.url);
};

// TODO: Figure out published packages
export const isUsingPublishedPackages = () => false;
export const isPreProductionBuild = () => false;
export const isBuildServerBuild = () => false;

export const isTypescriptInternalFramework = (internalFramework: InternalFramework) => {
    return TYPESCRIPT_INTERNAL_FRAMEWORKS.includes(internalFramework);
};

/**
 * Get Dev File URL for referencing on the front end
 */
export const getDevFileUrl = ({ filePath }: { filePath: string }) => {
    return pathJoin(SITE_BASE_URL, DEV_FILE_BASE_PATH, filePath);
};

export const getDevFileList = () => {
    const distFolder = getRootUrl();
    return Object.values(DEV_FILE_PATH_MAP).map((file) => {
        return pathJoin(distFolder.pathname, file);
    });
};

/**
 * Get url of example boiler plate files
 */
export const getBoilerPlateUrl = ({
    library,
    internalFramework,
}: {
    library: Library;
    internalFramework: InternalFramework;
}) => {
    let boilerPlateFramework;
    switch (internalFramework) {
        case 'reactFunctional':
            boilerPlateFramework = 'react';
            break;
        case 'reactFunctionalTs':
            boilerPlateFramework = 'react-ts';
            break;
        default:
            boilerPlateFramework = internalFramework;
            break;
    }

    const boilerplatePath = pathJoin(
        SITE_BASE_URL,
        '/example-runner',
        `${library}-${boilerPlateFramework}-boilerplate`
    );

    return boilerplatePath;
};

/**
 * Get dev files for local development
 */
export function getDevFiles(): DevFileRoute[] {
    const result = [];

    for (const [filePath, sourceFilePath] of Object.entries(DEV_FILE_PATH_MAP)) {
        const fullFilePath = pathJoin(getRootUrl().pathname, sourceFilePath);
        if (fullFilePath.includes('**')) {
            const pathPrefix = filePath.substring(0, filePath.indexOf('**'));
            const sourcePrefix = fullFilePath.substring(0, fullFilePath.indexOf('**'));

            const matches = glob.sync(fullFilePath);
            if (matches.length === 0) throw new Error(`No files match the glob ${fullFilePath}`);

            for (const globFile of matches) {
                const relativeFile = globFile.replace(sourcePrefix, '');

                result.push({
                    params: { filePath: `${pathPrefix}${relativeFile}` },
                    props: { fullFilePath: globFile },
                });
            }
            continue;
        }

        result.push({ params: { filePath }, props: { fullFilePath } });
    }

    return result;
}

export function getModelInterfaces() {
    return [{ params: { interfaceName: 'AgCartesianChartOptions' } }, { params: { interfaceName: 'AgChartTheme' } }];
}

export const getModelInterfaceUrl = ({ interfaceName }: { interfaceName: string }) => {
    return pathJoin(SITE_BASE_URL, 'debug', 'interface-models', `${interfaceName}.json`);
};
