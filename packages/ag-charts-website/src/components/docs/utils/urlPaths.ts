import type { Framework, InternalFramework } from '@ag-grid-types';
import { FRAMEWORK_REDIRECT_PATH, SITE_BASE_URL } from '@constants';
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

export function getFrameworkFromPath(path: string): Framework {
    return path.split('/')[DOCS_FRAMEWORK_PATH_INDEX] as Framework;
}

export function getPageNameFromPath(path: string): string {
    return path.split('/')[DOCS_PAGE_NAME_PATH_INDEX];
}

export const getExamplePageUrl = ({ framework, path }: { framework?: Framework; path: string }) => {
    const frameworkPath = framework ?? FRAMEWORK_REDIRECT_PATH;
    return pathJoin(SITE_BASE_URL, frameworkPath, path) + '/';
};

/**
 * Dynamic path where examples are
 *
 * Trailing slash: the example is served as a directory index, so a slashless URL costs a 301.
 * `getExampleContentsUrl`/`getExampleFileUrl` build on this through `pathJoin`, which drops the
 * slash again before appending a file name.
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
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName) + '/';
};

/**
 * Link to the standalone example page
 *
 * The same URL as `getExampleUrl`, under the name the shared docs components use. Grid's
 * `getExampleUrl` is slash-less because it doubles as the base its example file urls are appended
 * to, so grid needs the two names to differ; here `pathJoin` drops the trailing slash again when a
 * file name is appended, so one url serves both.
 */
export const getExampleLinkUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return getExampleUrl({ internalFramework, pageName, exampleName });
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
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'example-runner') + '/';
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
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'plunkr') + '/';
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
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'codesandbox') + '/';
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
