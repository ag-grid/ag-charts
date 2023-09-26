import { SITE_BASE_URL } from '@constants';
import { pathJoin } from './pathJoin';
import type { Framework } from '@ag-grid-types';

export const urlWithPrefix = ({
    url = '',
    framework,
    siteBaseUrl = SITE_BASE_URL,
}: {
    url: string;
    framework: Framework;
    siteBaseUrl?: string;
}): string => {
    const hasRelativePathRegex = /(^\.\/)(.*)/;
    const substitution = '$2';

    let path = url;
    if (url.match(hasRelativePathRegex)) {
        path = pathJoin('/', siteBaseUrl, framework, url.replace(hasRelativePathRegex, substitution));
    } else if (url.startsWith('/')) {
        path = pathJoin('/', siteBaseUrl, url);
    }

    return path;
};
