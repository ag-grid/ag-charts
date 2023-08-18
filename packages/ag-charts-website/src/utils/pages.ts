import type { CollectionEntry } from 'astro:content';
import { TYPESCRIPT_INTERNAL_FRAMEWORKS, SITE_BASE_URL, DEV_FILE_BASE_PATH } from '../constants';
import type { InternalFramework, Library } from '@ag-grid-types';
import { getIsDev } from './env';
import { pathJoin } from './pathJoin';

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
    'ag-charts-community/interfaces.AUTO.json': 'dist/packages/ag-charts-community/interfaces.AUTO.json',
    'ag-charts-community/doc-interfaces.AUTO.json': 'dist/packages/ag-charts-community/doc-interfaces.AUTO.json',

    'ag-charts-community/dist/ag-charts-community.cjs.js': 'packages/ag-charts-community/dist/main.cjs',
    'ag-charts-enterprise/dist/ag-charts-enterprise.cjs.js': 'packages/ag-charts-enterprise/dist/main.cjs',
    'ag-charts-community/dist/ag-charts-community.umd.js': 'packages/ag-charts-community/dist/main.umd.cjs',
    'ag-charts-enterprise/dist/ag-charts-enterprise.umd.js': 'packages/ag-charts-enterprise/dist/main.umd.cjs',
    'ag-charts-community/dist/main.cjs.map': 'packages/ag-charts-community/dist/main.cjs.map',
    'ag-charts-enterprise/dist/main.cjs.map': 'packages/ag-charts-enterprise/dist/main.cjs.map',
    'ag-charts-community/dist/main.umd.cjs.map': 'packages/ag-charts-community/dist/main.umd.cjs.map',
    'ag-charts-enterprise/dist/main.umd.cjs.map': 'packages/ag-charts-enterprise/dist/main.umd.cjs.map',
    'ag-charts-react/main.js': 'packages/ag-charts-react/dist/index.js',

    'ag-charts-vue/main.js': 'packages/ag-charts-vue/main.js',
    'ag-charts-vue/lib/AgChartsVue.js': 'packages/ag-charts-vue/lib/AgChartsVue.js',
    'ag-charts-vue3/lib/AgChartsVue.js': 'packages/ag-charts-vue3/lib/AgChartsVue.js',
};

export const getChartScriptPath = (sitePrefix?: string) => {
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-community/dist/ag-charts-community.umd.js');
};

export const getChartEnterpriseScriptPath = (sitePrefix?: string) => {
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-enterprise/dist/ag-charts-enterprise.umd.js');
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

export const urlWithBaseUrl = (url: string = '') => {
    const regex = /^\/(.*)/gm;
    const substitution = `${SITE_BASE_URL}$1`;

    return url.match(regex) ? url.replace(regex, substitution) : url;
};

// TODO: Figure out published packages
export const isUsingPublishedPackages = () => false;
export const isPreProductionBuild = () => false;
export const isBuildServerBuild = () => false;

export const isTypescriptInternalFramework = (internalFramework: InternalFramework) => {
    return TYPESCRIPT_INTERNAL_FRAMEWORKS.includes(internalFramework);
};

export const getCacheBustingUrl = (url: string, timestamp: number) => `${url}?t=${timestamp}`;

export function getNewFrameworkPath({
    path,
    currentFramework,
    newFramework,
}: {
    path: string;
    currentFramework: string;
    newFramework: string;
}) {
    return path.replace(`/${currentFramework}`, `/${newFramework}`);
}

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
    const files = Object.keys(DEV_FILE_PATH_MAP).map((filePath) => {
        const sourceFilePath = DEV_FILE_PATH_MAP[filePath];
        const fullFilePath = pathJoin(getRootUrl().pathname, sourceFilePath);

        return {
            filePath,
            fullFilePath,
        };
    });

    return files.map(({ filePath, fullFilePath }) => {
        return {
            params: {
                filePath,
            },
            props: {
                fullFilePath,
            },
        };
    });
}
