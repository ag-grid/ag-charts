import type { InternalFramework } from '@ag-grid-types';
import type { Framework } from '@ag-grid-types';
import { SITE_BASE_URL } from '@constants';
import { pathJoin } from '@utils/pathJoin';

import { DOCS_FRAMEWORK_PATH_INDEX } from '../constants';

export function getFrameworkFromPath(path: string) {
    return path.split('/')[DOCS_FRAMEWORK_PATH_INDEX];
}

export const getExamplePageUrl = ({ framework, path }: { framework: Framework; path: string }) => {
    return pathJoin({ path: [SITE_BASE_URL, framework, path] });
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
    return pathJoin({ path: [SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName] });
};

/**
 * Dynamic path where examples are with relative path for script files
 */
export const getExampleWithRelativePathUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin({ path: [SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'relative-path'] });
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
    return pathJoin({
        path: [
            getExampleUrl({
                internalFramework,
                pageName,
                exampleName,
            }),
            'contents.json',
        ],
    });
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
    return pathJoin({
        path: [
            getExampleUrl({
                internalFramework,
                pageName,
                exampleName,
            }),
            fileName,
        ],
    });
};

/**
 * Get image url on docs page
 */
export const getImageUrl = ({ pageName, imageName }: { pageName: string; imageName: string }) => {
    // Go up a directory to account for the framework path in the url
    return pathJoin({ path: [SITE_BASE_URL, 'docs', pageName, imageName] });
};
