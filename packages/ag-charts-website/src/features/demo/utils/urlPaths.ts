import { SITE_BASE_URL } from '../../../constants';
import { pathJoin } from '../../../utils/pathJoin';

export const getExampleUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin(SITE_BASE_URL, 'demo', 'examples', exampleName);
};

export const getExampleWithRelativePathUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin(SITE_BASE_URL, 'demo', 'examples', exampleName, 'relative-path');
};

export const getPageUrl = (pageName: string) => {
    return pathJoin(SITE_BASE_URL, 'demo', pageName);
};

export const getPageHashUrl = ({ chartTypeSlug, isRelative }: { chartTypeSlug: string; isRelative?: boolean }) => {
    const hash = `#${chartTypeSlug}`;
    return isRelative ? hash : pathJoin(SITE_BASE_URL, 'demo', hash);
};

export const getExampleContentsUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin(
        getExampleUrl({
            exampleName,
        }),
        'contents'
    );
};

export const getExampleFileUrl = ({ exampleName, fileName }: { exampleName: string; fileName: string }) => {
    return pathJoin(
        getExampleUrl({
            exampleName,
        }),
        fileName
    );
};
