import type { InternalFramework } from '@ag-grid-types';
import fs from 'node:fs/promises';

import { getIsDev } from '../../utils/env';
import { ANGULAR_GENERATED_MAIN_FILE_NAME, SOURCE_ENTRY_FILE_NAME } from './constants';
import chartVanillaSrcParser from './transformation-scripts/chart-vanilla-src-parser';
import type { GeneratedContents } from './types.d';
import { getEntryFileName, getFileContents, getIsEnterprise, getTransformTsFileExt } from './utils/fileUtils';
import { frameworkFilesGenerator } from './utils/frameworkFilesGenerator';
import { getOtherScriptFiles } from './utils/getOtherScriptFiles';
import { getStyleFiles } from './utils/getStyleFiles';

class ContentCache<K extends object, V> {
    private cacheKeyMap = new Map<string, K>();
    private cache = new WeakMap<K, V>();
    private readonly keyToCacheKey: (k: K) => string;

    constructor(...keys: (keyof K)[]) {
        const parts = new Array(keys.length);
        this.keyToCacheKey = (k: K) => {
            for (let i = 0; i < keys.length; i++) {
                parts[i] = k[keys[i]];
            }
            return parts.join('_');
        };
    }

    get(key: K) {
        const keyStr = this.keyToCacheKey(key);
        const cacheKey = this.cacheKeyMap.get(keyStr);

        if (cacheKey && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return undefined;
    }

    set(key: K, val: V) {
        const keyStr = this.keyToCacheKey(key);

        this.cacheKeyMap.set(keyStr, key);
        this.cache.set(key, val);
    }

    invalidate() {
        for (const key of this.cacheKeyMap.values()) {
            this.cache.delete(key);
        }
        this.cacheKeyMap.clear();
    }
}

const fileListCache = new ContentCache<FileListParams, string[]>('internalFramework', 'folderUrl');

type FileListParams = {
    internalFramework: InternalFramework;
    folderUrl: URL;
};

/**
 * Get the file list of the generated contents
 * (without generating the contents)
 */
export const getGeneratedContentsFileList = async (params: FileListParams): Promise<string[]> => {
    const { internalFramework, folderUrl } = params;

    if (!getIsDev()) {
        const cachedResult = fileListCache.get(params);
        if (cachedResult) return cachedResult;
    }

    const entryFileName = getEntryFileName(internalFramework)!;
    const sourceFileList = await fs.readdir(folderUrl);

    const scriptFiles = await getOtherScriptFiles({
        folderUrl,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({
        folderUrl,
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

    fileListCache.set(params, generatedFileList);

    return generatedFileList;
};

const contentCache = new ContentCache<GeneratedContentParams, GeneratedContents>(
    'internalFramework',
    'folderUrl',
    'ignoreDarkMode'
);

type GeneratedContentParams = {
    internalFramework: InternalFramework;
    folderUrl: URL;
    ignoreDarkMode?: boolean;
};

/**
 * Get generated contents for an example
 */
export const getGeneratedContents = async (params: GeneratedContentParams): Promise<GeneratedContents | undefined> => {
    if (!getIsDev()) {
        const cachedResult = contentCache.get(params);
        if (cachedResult) return cachedResult;
    }

    const { internalFramework, folderUrl, ignoreDarkMode } = params;
    const sourceFileList = await fs.readdir(folderUrl);

    const entryFile = await getFileContents({ folderUrl, fileName: SOURCE_ENTRY_FILE_NAME }).catch(() => {}); // Fail silently

    if (!entryFile) {
        return;
    }

    const indexHtml = await getFileContents({ folderUrl, fileName: 'index.html' });

    const otherScriptFiles = await getOtherScriptFiles({
        folderUrl,
        sourceFileList,
        transformTsFileExt: getTransformTsFileExt(internalFramework),
    });
    const styleFiles = await getStyleFiles({ folderUrl, sourceFileList });

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

    const { files, boilerPlateFiles, scriptFiles, entryFileName, mainFileName } = await getFrameworkFiles({
        entryFile,
        indexHtml,
        isEnterprise,
        bindings,
        typedBindings,
        otherScriptFiles,
        ignoreDarkMode,
    });

    const result: GeneratedContents = {
        isEnterprise,
        scriptFiles: scriptFiles!,
        styleFiles: Object.keys(styleFiles),
        sourceFileList,
        files: Object.assign(styleFiles, files),
        boilerPlateFiles: boilerPlateFiles!,
        entryFileName,
        mainFileName,
    };

    contentCache.set(params, result);
    return result;
};
