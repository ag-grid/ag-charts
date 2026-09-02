import type { Framework } from '@ag-grid-types';
import { addAbsoluteTrailingSlash } from '@ag-website-shared/utils/addTrailingSlash';
import { CHARTS_SITE_URL } from '@constants';
import { pathJoin } from '@utils/pathJoin';

export const chartsUrlWithPrefix = ({
    url = '',
    framework,
    siteBaseUrl = CHARTS_SITE_URL,
}: {
    url: string;
    framework?: Framework;
    siteBaseUrl?: string;
}): string => {
    // `pathJoin` strips the trailing slash off every segment, so it is re-added here: the charts
    // pages are directory indexes and a slashless URL costs a 301 hop.
    let path = url;
    if (url.startsWith('./')) {
        path = addAbsoluteTrailingSlash(pathJoin(siteBaseUrl, framework, url.slice('./'.length)));
    } else if (url.startsWith('/')) {
        path = addAbsoluteTrailingSlash(pathJoin(siteBaseUrl, url));
    }

    return path;
};
