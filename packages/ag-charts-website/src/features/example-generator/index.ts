import fs from 'node:fs/promises';
import path from 'node:path';

import type { AgChartThemeName } from 'ag-charts-community';

import { getIsDev } from '../../utils/env';
import { getExampleRootFileUrl, getThumbnailRootFileUrl } from '../../utils/pages';
import type { InternalFramework } from './types';

type GeneratedExampleParams = ExampleParams & (GalleryExampleParams | DocsExampleParams | ThumbnailParams);

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

type ThumbnailParams = {
    type: 'gallery-thumbnail';
    theme: AgChartThemeName;
    format: 'png' | 'webp';
};

const getFolderPath = (params: GeneratedExampleParams) => {
    const { exampleName, ignoreDarkMode = false } = params;

    const contentRoot = params.type === 'gallery-thumbnail' ? getThumbnailRootFileUrl() : getExampleRootFileUrl();

    const result = [contentRoot.pathname];
    const darkMode = ignoreDarkMode ? 'plain' : 'dark-mode';
    if (params.type === 'gallery') {
        result.push(params.type, '_examples', exampleName);
        result.push(darkMode, 'vanilla');
    } else if (params.type === 'docs') {
        result.push(params.type, params.pageName, '_examples', exampleName);
        result.push(darkMode, params.framework);
    } else if (params.type === 'gallery-thumbnail') {
        const type = params.type.split('-')[0];
        result.push(type, '_examples', exampleName);
    }

    return path.join(...result);
};

const getContentJsonPath = (params: GeneratedExampleParams) => {
    const folderPath = getFolderPath(params);

    return path.join(folderPath, 'contents.json');
};

const getThumbnailPath = (params: ExampleParams & ThumbnailParams) => {
    const folderPath = getFolderPath(params);

    return path.join(folderPath, `${params.theme}.${params.format}`);
};

type GeneratedContents = {
    entryFileName: string;
    files: Record<string, string>;
    scriptFiles: string[];
};

const cacheKeys: Record<string, object> = {};
const cacheValues = new WeakMap<object, GeneratedContents>();

const readContentJson = async (params: GeneratedExampleParams) => {
    const useCache = !getIsDev();
    const jsonPath = getContentJsonPath(params);

    let result;

    const cacheKey = cacheKeys[jsonPath] ?? { jsonPath };
    if (useCache) {
        if (cacheValues.has(cacheKey)) {
            result = cacheValues.get(cacheKey);
        }
    }

    if (!result) {
        const buffer = await fs.readFile(jsonPath);
        result = JSON.parse(buffer.toString('utf-8')) as GeneratedContents;
    }

    if (useCache) {
        cacheKeys[jsonPath] = cacheKey;
        cacheValues.set(cacheKey, result);
    }

    return result;
};

export const getGeneratedContentsFileList = async (params: GeneratedExampleParams) => {
    const contents = await readContentJson(params);

    return Object.keys(contents.files);
};

export const getGeneratedContents = async (params: GeneratedExampleParams) => {
    return readContentJson(params);
};

export const getThumbnailContents = async (params: ExampleParams & ThumbnailParams) => {
    const imgPath = getThumbnailPath(params);
    return await fs.readFile(imgPath);
};
