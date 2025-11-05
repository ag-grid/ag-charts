import { GRID_URL, SITE_URL } from '@constants';
import { pathJoin } from '@utils/pathJoin';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

export type ResultType = 'success' | 'failure';

console.log(GRID_URL);
console.log(GRID_URL);
console.log(GRID_URL);
console.log(GRID_URL);
export const RETURN_URLS: Record<ResultType, string> = {
    // NOTE: Need to add trailing slash to avoid 302 redirect on S3
    success: pathJoin(GRID_URL, '/contact/success') + '/',
    failure: pathJoin(GRID_URL, '/contact/failure') + '/',
};
