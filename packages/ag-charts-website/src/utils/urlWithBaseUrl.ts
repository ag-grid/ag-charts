import { SITE_BASE_URL } from '../constants';
import { pathJoin } from './pathJoin';

export const urlWithBaseUrl = (url: string = '') => {
    const regex = /^\/(.*)/gm;

    return url.match(regex) ? (SITE_BASE_URL ? pathJoin(SITE_BASE_URL, url) : url) : url;
};
