import type { InternalFramework } from '@ag-grid-types';
import type { CollectionEntry } from 'astro:content';
import fsPromise from 'fs/promises';
import glob from 'glob';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    FAIL_ON_UNMATCHED_GLOBS,
    SITE_BASE_URL,
    TYPESCRIPT_INTERNAL_FRAMEWORKS,
    USE_PUBLISHED_PACKAGES,
} from '../constants';
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
    'resolved-interfaces.json': 'dist/packages/ag-charts-types/resolved-interfaces.AUTO.json',

    'ag-charts-locale/dist/**': 'packages/ag-charts-locale/dist/**/*.{cjs,mjs,js,map}',
    'ag-charts-community/dist/**': 'packages/ag-charts-community/dist/**/*.{cjs,mjs,js,map}',
    'ag-charts-core/dist/**': 'packages/ag-charts-core/dist/**/*.{cjs,mjs,js,map}',
    'ag-charts-enterprise/dist/**': 'packages/ag-charts-enterprise/dist/**/*.{cjs,mjs,js,map}',
    // Served so the import map can resolve it: an example's `ag-charts-types` import is
    // usually type-only and so erased, but a value import would otherwise 404
    'ag-charts-types/dist/**': 'packages/ag-charts-types/dist/**/*.{cjs,mjs,js,map}',
    'ag-charts-react/dist/**': 'packages/ag-charts-react/dist/**/*.{cjs,mjs,js,map}',
    'ag-charts-vue3/dist/**': 'packages/ag-charts-vue3/dist/**/*.{cjs,mjs,js,map}',

    'ag-charts-angular/fesm2022/ag-charts-angular.mjs':
        'packages/ag-charts-angular/dist/ag-charts-angular/fesm2022/ag-charts-angular.mjs',

    'ag-charts-thumbnails/**': 'dist/generated-thumbnails/ag-charts-website/gallery/_examples/**/*.{png,webp}',
};

/**
 * The root url where the monorepo exists
 *
 * Anchored to `process.cwd()` (the `packages/ag-charts-website` project dir for both
 * `astro dev` and the nx build). Avoids `import.meta.url`, which resolves to the
 * bundled chunk location at build time and so breaks when Astro's output structure
 * changes (e.g. the extra `dist/.prerender/chunks/` level added in Astro 6).
 */
export const getRootUrl = (): URL => {
    return pathToFileURL(path.resolve(process.cwd(), '../../') + path.sep);
};

export const getPublicFileUrl = (): URL => {
    return pathToFileURL(path.resolve(process.cwd(), 'public') + path.sep);
};

export const getContentRootFileUrl = (): URL => {
    return pathToFileURL(path.resolve(process.cwd(), 'src/content') + path.sep);
};

export const getExampleRootFileUrl = (): URL => {
    return pathToFileURL(path.resolve(getRootUrl().pathname, 'dist/generated-examples/ag-charts-website') + path.sep);
};

export const getThumbnailRootFileUrl = (): URL => {
    return pathToFileURL(path.resolve(getRootUrl().pathname, 'dist/generated-thumbnails/ag-charts-website') + path.sep);
};

export const getDebugFolderUrl = (): URL => {
    return pathToFileURL(path.resolve(process.cwd(), 'src/pages/debug') + path.sep);
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
    const pages = await fsPromise.readdir(debugFolder);
    const filteredPages = allFiles
        ? pages
        : pages.filter((pageName) => {
              return pageName.match(/\.astro$/);
          });

    const pagePathPromises = filteredPages
        .map((pageName) => {
            const pageNameWithoutExt = pageName.replace(/\.[^.]+$/, '');
            return urlWithBaseUrl(pathJoin('/debug', pageNameWithoutExt));
        })
        .flat();

    return pagePathPromises;
};

// TODO: Figure out published packages
export const isUsingPublishedPackages = () => USE_PUBLISHED_PACKAGES === true;
export const isPreProductionBuild = () => false;
export const isBuildServerBuild = () => false;

export const isTypescriptInternalFramework = (internalFramework: InternalFramework) => {
    return TYPESCRIPT_INTERNAL_FRAMEWORKS.includes(internalFramework);
};

/**
 * Get Dev File URL for referencing on the front end
 */
export const getDevFileList = () => {
    const distFolder = getRootUrl();
    return Object.values(DEV_FILE_PATH_MAP).map((file) => {
        return pathJoin(distFolder.pathname, file);
    });
};

/**
 * Get dev files for local development
 */
export function getDevFiles(): DevFileRoute[] {
    const result = [];

    for (const filePath of Object.keys(DEV_FILE_PATH_MAP)) {
        const sourceFilePath = DEV_FILE_PATH_MAP[filePath];
        const fullFilePath = pathJoin(getRootUrl().pathname, sourceFilePath);
        if (fullFilePath.includes('**')) {
            const pathPrefix = filePath.substring(0, filePath.indexOf('**'));
            const sourcePrefix = fullFilePath.substring(0, fullFilePath.indexOf('**'));

            const matches = glob.sync(fullFilePath);
            if (matches.length === 0) {
                if (FAIL_ON_UNMATCHED_GLOBS) throw new Error(`No files match the glob ${fullFilePath}`);

                // eslint-disable-next-line no-console
                console.warn(`No files match the glob ${fullFilePath}`);
            }

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
