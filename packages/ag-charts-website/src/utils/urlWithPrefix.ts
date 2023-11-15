import type { Framework } from '@ag-grid-types';
import { SITE_BASE_URL } from '@constants';

import { pathJoin } from './pathJoin';

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
        path = pathJoin({
            path: ['/', siteBaseUrl, framework, url.replace(hasRelativePathRegex, substitution)],
            addTrailingSlash: true,
        });
    } else if (url.startsWith('/')) {
        path = pathJoin({ path: ['/', siteBaseUrl, url], addTrailingSlash: true });
    }

    return path;
};
