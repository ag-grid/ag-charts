import { SITE_BASE_URL } from '@constants';
import type { InternalFramework } from '@ag-grid-types';
import { pathJoin } from '@utils/pathJoin';
import { DOCS_FRAMEWORK_PATH_INDEX } from '../constants';
import type { Framework } from '@ag-grid-types';

export function getFrameworkFromPath(path: string) {
    return path.split('/')[DOCS_FRAMEWORK_PATH_INDEX];
}

export const getExamplePageUrl = ({ framework, path }: { framework: Framework; path: string }) => {
    return pathJoin(SITE_BASE_URL, framework, path);
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
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'relative-path');
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
