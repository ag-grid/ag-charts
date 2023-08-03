import { SITE_BASE_URL } from '../../../constants';
import { pathJoin } from '../../../utils/pathJoin';

export const getExampleUrl = ({ exampleName, isFullPath }: { exampleName: string; isFullPath?: boolean }) => {
    const path = pathJoin(SITE_BASE_URL, 'demo', 'examples', exampleName);
    const fullPath = pathJoin(import.meta.env.SITE_URL, path);
    return isFullPath ? fullPath : path;
};

export const getExampleImageUrl = ({ exampleName }: { exampleName: string }) => {
    const imageUrl = pathJoin(SITE_BASE_URL, 'demo', 'examples', `${exampleName}.png`);
    return imageUrl;
};

export const getPlainExampleUrl = ({
    exampleName,
    isFullPath,
    excludeSiteBaseUrl,
}: {
    exampleName: string;
    isFullPath?: boolean;
    excludeSiteBaseUrl?: boolean;
}) => {
    const plainExamplePath = pathJoin('demo', 'examples', exampleName, 'plain');
    const fullPlainExamplePath = excludeSiteBaseUrl ? plainExamplePath : pathJoin(SITE_BASE_URL, plainExamplePath);
    const fullPath = pathJoin(import.meta.env?.SITE_URL, fullPlainExamplePath);
    return isFullPath ? fullPath : fullPlainExamplePath;
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
