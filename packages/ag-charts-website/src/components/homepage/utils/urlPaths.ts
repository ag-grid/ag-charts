import { SITE_BASE_URL } from '@constants';
import type { ThemeName } from '@stores/themeStore';
import { getDevFileUrl } from '@utils/devFileUrl';
import { pathJoin } from '@utils/pathJoin';

/**
 * Deliberately unslashed: this is a base, not a link. It becomes `appLocation`, which `SystemJs`
 * injects verbatim as the SystemJS `app` module-map target, so its exact spelling is load-bearing.
 * Use `getExampleLinkUrl` for anything the browser navigates or fetches.
 */
export const getExampleUrl = ({ exampleName, isFullPath }: { exampleName: string; isFullPath?: boolean }) => {
    const path = pathJoin(SITE_BASE_URL, 'gallery', 'examples', exampleName);
    const fullPath = pathJoin(import.meta.env?.PUBLIC_SITE_URL, path);
    return isFullPath ? fullPath : path;
};

/**
 * The example page as a URL to navigate or fetch.
 *
 * The page is served as a directory index, so a slashless URL costs a 301 hop (SE-166).
 */
export const getExampleLinkUrl = (params: { exampleName: string; isFullPath?: boolean }) => {
    return getExampleUrl(params) + '/';
};

export const getExampleRunnerExampleUrl = ({
    exampleName,
    isFullPath,
}: {
    exampleName: string;
    isFullPath?: boolean;
}) => {
    const path = pathJoin(SITE_BASE_URL, 'gallery', 'examples', exampleName, 'example-runner') + '/';
    const fullPath = pathJoin(import.meta.env?.PUBLIC_SITE_URL, path) + '/';
    return isFullPath ? fullPath : path;
};

export const getExampleImageUrl = ({
    exampleName,
    theme,
    dpi,
    ext,
}: {
    exampleName: string;
    theme: ThemeName;
    dpi: 1 | 2;
    ext: 'png' | 'webp';
}) => {
    const dpiExt = dpi === 1 ? '' : `@${dpi}x`;
    const imageUrl = getDevFileUrl({ filePath: `/ag-charts-thumbnails/${exampleName}/${theme}${dpiExt}.${ext}` });
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
    const plainExamplePath = pathJoin('gallery', 'examples', exampleName, 'plain');
    const fullPlainExamplePath =
        (excludeSiteBaseUrl ? plainExamplePath : pathJoin(SITE_BASE_URL, plainExamplePath)) + '/';
    const fullPath = pathJoin(import.meta.env?.PUBLIC_SITE_URL, fullPlainExamplePath) + '/';
    return isFullPath ? fullPath : fullPlainExamplePath;
};

export const getExampleCodeSandboxUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin(SITE_BASE_URL, 'gallery', 'examples', exampleName, 'codesandbox') + '/';
};

export const getExamplePlunkrUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin(SITE_BASE_URL, 'gallery', 'examples', exampleName, 'plunkr') + '/';
};

export const getPageUrl = (pageName: string) => {
    return pathJoin(SITE_BASE_URL, 'gallery', pageName) + '/';
};

export const getPageHashUrl = ({ chartSeriesName, isRelative }: { chartSeriesName: string; isRelative?: boolean }) => {
    const hash = `#${chartSeriesName}`;
    return isRelative ? hash : pathJoin(SITE_BASE_URL, 'gallery', hash) + '/';
};

export const getExampleContentsUrl = ({ exampleName }: { exampleName: string }) => {
    return pathJoin(
        getExampleUrl({
            exampleName,
        }),
        'contents.json'
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
