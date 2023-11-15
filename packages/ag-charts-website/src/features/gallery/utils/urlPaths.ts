import { SITE_BASE_URL } from '@constants';
import type { ThemeName } from '@stores/themeStore';
import { pathJoin } from '@utils/pathJoin';

export const getExampleUrl = ({ exampleName, isFullPath }: { exampleName: string; isFullPath?: boolean }) => {
    const path = pathJoin({ path: [SITE_BASE_URL, 'gallery', 'examples', exampleName], addTrailingSlash: true });
    const fullPath = pathJoin({ path: [import.meta.env?.PUBLIC_SITE_URL, path], addTrailingSlash: true });
    return isFullPath ? fullPath : path;
};

export const getPlainExampleImageUrl = ({ exampleName, theme }: { exampleName: string; theme: ThemeName }) => {
    const imageUrl = pathJoin({ path: [SITE_BASE_URL, 'gallery', 'examples', `${exampleName}/${theme}-plain.png`] });
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
    const plainExamplePath = pathJoin({ path: ['gallery', 'examples', exampleName, 'plain'] });
    const fullPlainExamplePath = excludeSiteBaseUrl
        ? plainExamplePath
        : pathJoin({ path: [SITE_BASE_URL, plainExamplePath] });
    const fullPath = pathJoin({ path: [import.meta.env?.PUBLIC_SITE_URL, fullPlainExamplePath] });
    return isFullPath ? fullPath : fullPlainExamplePath;
};

export const getExampleWithRelativePathUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin({ path: [SITE_BASE_URL, 'gallery', 'examples', exampleName, 'relative-path'] });
};

export const getPageUrl = (pageName: string) => {
    return pathJoin({ path: [SITE_BASE_URL, 'gallery', pageName], addTrailingSlash: true });
};

export const getPageHashUrl = ({ chartSeriesName, isRelative }: { chartSeriesName: string; isRelative?: boolean }) => {
    const hash = `#${chartSeriesName}`;
    return isRelative ? hash : pathJoin({ path: [SITE_BASE_URL, 'gallery', hash] });
};

export const getExampleContentsUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin({
        path: [
            getExampleUrl({
                exampleName,
            }),
            'contents.json',
        ],
    });
};

export const getExampleFileUrl = ({ exampleName, fileName }: { exampleName: string; fileName: string }) => {
    return pathJoin({
        path: [
            getExampleUrl({
                exampleName,
            }),
            fileName,
        ],
    });
};
