import fs from 'node:fs/promises';
import path from 'node:path';

import { getIsDev } from '../../utils/env';
import { getExampleRootFileUrl } from '../../utils/pages';
import type { ExampleSubstitutions, InternalFramework } from './types';

export type GeneratedExampleParams = ExampleParams & (GalleryExampleParams | DocsExampleParams);

type ExampleParams = {
    exampleName: string;
    ignoreDarkMode?: boolean;
};

type GalleryExampleParams = {
    type: 'gallery';
};

type DocsExampleParams = {
    type: 'docs';
    framework: InternalFramework;
    pageName: string;
};

const getFolderPath = (params: GeneratedExampleParams) => {
    const { exampleName, ignoreDarkMode = false } = params;

    const contentRoot = getExampleRootFileUrl();

    const result = [contentRoot.pathname];
    const darkMode = ignoreDarkMode ? 'plain' : 'dark-mode';
    if (params.type === 'gallery') {
        result.push(params.type, '_examples', exampleName);
        result.push(darkMode, 'vanilla');
    } else if (params.type === 'docs') {
        result.push(params.type, params.pageName, '_examples', exampleName);
        result.push(darkMode, params.framework);
    }

    return path.join(...result);
};

const getContentJsonPath = (params: GeneratedExampleParams) => {
    const folderPath = getFolderPath(params);

    return path.join(folderPath, 'contents.json');
};

type GeneratedContents = {
    entryFileName: string;
    files: Record<string, string>;
    scriptFiles: string[];
};

const DEFAULT_SUBSTITUTIONS: ExampleSubstitutions = {
    '${baseWWWUrl}': `${process.env.PUBLIC_SITE_URL ?? 'https://www.ag-grid.com'}${process.env.PUBLIC_BASE_URL ?? '/'}`,
};

const cacheKeys: Record<string, object> = {};
const cacheValues = new WeakMap<object, GeneratedContents>();

const readContentJson = async (params: GeneratedExampleParams): Promise<GeneratedContents | undefined> => {
    const useCache = !getIsDev();
    const jsonPath = getContentJsonPath(params);

    let result;

    const cacheKey = cacheKeys[jsonPath] ?? { jsonPath };
    if (useCache) {
        if (cacheValues.has(cacheKey)) {
            result = cacheValues.get(cacheKey);
        }
    }

    if (result == null) {
        try {
            result = JSON.parse(await fs.readFile(jsonPath, 'utf-8')) as GeneratedContents;
        } catch (e) {
            if (!getIsDev()) {
                throw e;
            }
        }
    }

    if (result != null && useCache) {
        cacheKeys[jsonPath] = cacheKey;
        cacheValues.set(cacheKey, result);
    }

    return applySubstitutions(result, DEFAULT_SUBSTITUTIONS);
};

export const getGeneratedContentsFileList = async (params: GeneratedExampleParams) => {
    const contents = await readContentJson(params);

    return contents != null ? Object.keys(contents.files) : [];
};

export const getGeneratedContents = async (params: GeneratedExampleParams) => {
    // Generated from `plugins/ag-charts-generate-example-files`
    return readContentJson(params);
};

function applySubstitutions(content?: GeneratedContents, substitutions?: ExampleSubstitutions) {
    if (content == null || substitutions == null) {
        return content;
    }

    Object.keys(substitutions).forEach((key) => {
        const value = substitutions[key as keyof ExampleSubstitutions];
        if (value == null) {
            throw new Error(`Substitution value is null for key: ${key}`);
        }

        Object.keys(content.files).forEach((file) => {
            let count = 0;
            while (content.files[file].includes(key)) {
                count++;
                content.files[file] = content.files[file].replace(key, value);

                if (count > 1000) {
                    throw new Error('Substitution limit of 1000 reached, is this a bug?');
                }
            }
        });
    });

    return content;
}
