import type { InternalFramework } from '@ag-grid-types';
import type { Framework } from '@ag-grid-types';
import { SITE_BASE_URL } from '@constants';
import { pathJoin } from '@utils/pathJoin';

import { DOCS_FRAMEWORK_PATH_INDEX, DOCS_PAGE_NAME_PATH_INDEX } from '../constants';

/**
 * Get framework path in url
 *
 * Not as relevant in charts, but allows charts/grid to use the same
 * shared files
 */
export function getFrameworkPath(framework: Framework) {
    return framework;
}

export function getFrameworkFromPath(path: string) {
    return path.split('/')[DOCS_FRAMEWORK_PATH_INDEX];
}

export function getPageNameFromPath(path: string): string {
    return path.split('/')[DOCS_PAGE_NAME_PATH_INDEX];
}

export const getExamplePageUrl = ({ framework, path }: { framework: Framework; path: string }) => {
    return pathJoin(SITE_BASE_URL, framework, path) + '/';
};

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
 * Dynamic path where docs example runner examples are
 */
export const getExampleRunnerExampleUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'example-runner');
};

/**
 * Dynamic path for Plunkr examples url
 */
export const getExamplePlunkrUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'plunkr');
};

/**
 * Dynamic path for Code Sandbox examples url
 */
export const getExampleCodeSandboxUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'codesandbox');
};

/**
 * Endpoint for all example files
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
        'contents.json'
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

/**
 * Get image url on docs page
 */
export const getImageUrl = ({ pageName, imageName }: { pageName: string; imageName: string }) => {
    // Go up a directory to account for the framework path in the url
    return pathJoin(SITE_BASE_URL, 'docs', pageName, imageName);
};
