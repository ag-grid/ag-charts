import type { CollectionEntry } from 'astro:content';
import {
    FRAMEWORKS,
    INTERNAL_FRAMEWORKS,
    TYPESCRIPT_INTERNAL_FRAMEWORKS,
    SITE_BASE_URL,
    FRAMEWORK_PATH_INDEX,
    DEV_FILE_BASE_PATH,
} from '../constants';
import { getSourceExamplesPathUrl } from '../features/examples-generator/utils/fileUtils';
import type { InternalFramework, Library } from '../types/ag-grid';
import { getGeneratedContentsFileList } from '../features/examples-generator/examplesGenerator';
import { getIsDev } from './env';
import { getFolders } from './fs';
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

function ignoreUnderscoreFiles(page: DocsPage) {
    const pageFolders = page.slug.split('/');
    const pageName = pageFolders[pageFolders.length - 1];
    return pageName && !pageName.startsWith('_');
}

export function getFrameworkFromPath(path: string) {
    return path.split('/')[FRAMEWORK_PATH_INDEX];
}

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

export function getDocPagesList(pages: DocsPage[]) {
    return pages.filter(ignoreUnderscoreFiles);
}

export function getDocPages(pages: DocsPage[]) {
    const frameworkPages = FRAMEWORKS.map((framework) => {
        return getDocPagesList(pages).map((page) => {
            return {
                framework,
                pageName: page.slug,
                page,
            };
        });
    }).flat();

    return frameworkPages.map(({ framework, pageName, page }) => {
        return {
            params: {
                framework,
                pageName,
            },
            props: {
                page,
            },
        };
    });
}

/**
 * Dynamic path where examples are
 */
export const getExampleUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName);
};

/**
 * Dynamic path where examples are with relative path for script files
 */
export const getExampleUrlWithRelativePath = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'relative-path');
};

/**
 * Get endpoint for all example files
 */
export const getExampleContentsUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(
        getExampleUrl({
            internalFramework,
            pageName,
            exampleName,
        }),
        'contents'
    );
};

/**
 * Dynamic path where example files are
 */
export const getExampleFileUrl = ({
    internalFramework,
    pageName,
    exampleName,
    fileName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
    fileName: string;
}) => {
    return pathJoin(
        getExampleUrl({
            internalFramework,
            pageName,
            exampleName,
        }),
        fileName
    );
};

export const getDevFileUrl = ({ filePath }: { filePath: string }) => {
    return pathJoin(SITE_BASE_URL, DEV_FILE_BASE_PATH, filePath);
};

export const getDemoExampleUrl = (demoExampleName: string) => {
    return pathJoin(SITE_BASE_URL, 'demo', demoExampleName);
};

export const getDemoPageHashUrl = (categoryId: string) => {
    return pathJoin(SITE_BASE_URL, 'demo', `#${categoryId}`);
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

export const getInternalFrameworkExamples = async ({
    pages,
}: {
    pages: DocsPage[];
}): Promise<InternalFrameworkExample[]> => {
    const internalFrameworkPageNames = INTERNAL_FRAMEWORKS.map((internalFramework) => {
        return pages.map((page) => {
            return { internalFramework, pageName: page.slug };
        });
    }).flat();

    const examplePromises = internalFrameworkPageNames.map(async ({ internalFramework, pageName }) => {
        const sourceExamplesPathUrl = getSourceExamplesPathUrl({
            pageName,
        });

        const examples = await getFolders(sourceExamplesPathUrl.pathname);
        return examples.map((exampleName) => {
            return {
                internalFramework,
                pageName,
                exampleName,
            };
        });
    });
    const examples = (await Promise.all(examplePromises)).flat();
    return examples;
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

export async function getDocExamplePages({ pages }: { pages: DocsPage[] }) {
    const examples = await getInternalFrameworkExamples({ pages });

    return examples.map(({ internalFramework, pageName, exampleName }) => {
        return {
            params: {
                internalFramework,
                pageName,
                exampleName,
            },
        };
    });
}

export async function getDocExampleFiles({ pages }: { pages: DocsPage[] }) {
    const examples = await getInternalFrameworkExamples({ pages });
    const exampleFilesPromises = examples.map(async ({ internalFramework, pageName, exampleName }) => {
        const exampleFileList = await getGeneratedContentsFileList({
            internalFramework,
            pageName,
            exampleName,
        });

        return exampleFileList.map((fileName) => {
            return {
                internalFramework,
                pageName,
                exampleName,
                fileName,
            };
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles.map(({ internalFramework, pageName, exampleName, fileName }) => {
        return {
            params: {
                internalFramework,
                pageName,
                exampleName,
                fileName,
            },
        };
    });
}
