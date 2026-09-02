import type { Framework } from '@ag-grid-types';
import { addAbsoluteTrailingSlash } from '@ag-website-shared/utils/addTrailingSlash';
import { GRID_URL } from '@constants';
import { pathJoin } from '@utils/pathJoin';

export const gridUrlWithPrefix = ({
    url = '',
    framework,
    siteBaseUrl = GRID_URL,
}: {
    url: string;
    framework?: Framework;
    siteBaseUrl?: string;
}): string => {
    // `pathJoin` strips the trailing slash off every segment, so it is re-added here: the grid
    // pages are directory indexes and a slashless URL costs a 301 hop.
    let path = url;
    if (url.startsWith('./')) {
        const gridFrameworkPath = `${framework}-data-grid`;
        path = addAbsoluteTrailingSlash(pathJoin(siteBaseUrl, gridFrameworkPath, url.slice('./'.length)));
    } else if (url.startsWith('/')) {
        path = addAbsoluteTrailingSlash(pathJoin(siteBaseUrl, url));
    }

    return path;
};
