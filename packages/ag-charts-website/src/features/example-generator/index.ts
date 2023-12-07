import fs from 'node:fs/promises';
import path from 'node:path';

import { getExampleRootFileUrl } from '../../utils/pages';
import type { InternalFramework } from './types';

type GeneratedExampleParams = ExampleParams & (GalleryExampleParams | DocsExampleParams);

type ExampleParams = {
    exampleName: string;
    framework: InternalFramework;
    ignoreDarkMode?: boolean;
};

type GalleryExampleParams = {
    type: 'gallery';
};

type DocsExampleParams = {
    type: 'docs';
    pageName: string;
};

const getFolderPath = (params: GeneratedExampleParams) => {
    const { exampleName, framework, ignoreDarkMode = false } = params;
    const contentRoot = getExampleRootFileUrl();

    const result = [contentRoot.pathname, params.type];
    if (params.type === 'gallery') {
        result.push('_examples', exampleName);
    } else {
        result.push(params.pageName, '_examples', exampleName);
    }
    result.push(ignoreDarkMode ? 'plain' : 'dark-mode', framework);

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

const readContentJson = async (params: GeneratedExampleParams) => {
    const folderPath = getFolderPath(params);

    const jsonPath = getContentJsonPath(params);
    const buffer = await fs.readFile(jsonPath);

    return JSON.parse(buffer.toString('utf-8')) as GeneratedContents;
};

export const getGeneratedContentsFileList = async (params: GeneratedExampleParams) => {
    const contents = await readContentJson(params);

    return Object.keys(contents.files);
};

export const getGeneratedContents = async (params: GeneratedExampleParams) => {
    return readContentJson(params);
};
