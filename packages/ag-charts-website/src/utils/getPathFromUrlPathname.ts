import { SITE_BASE_URL } from '../constants';

export const getPathFromUrlPathname = (pathname: string) => {
    const regex = new RegExp(`^${SITE_BASE_URL}(.*)`);
    const substitution = '$1';

    return pathname.replace(regex, substitution);
};
