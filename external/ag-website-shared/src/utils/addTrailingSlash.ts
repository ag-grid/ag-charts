import { isExternalLink } from './isExternalLink';

export function addTrailingSlash(url: string) {
    const hasTrailingSlash = url.endsWith('/');
    const hasAnchor = url.includes('#');
    const externalLink = isExternalLink(url);

    return hasAnchor || hasTrailingSlash || externalLink ? url : url + '/';
}

/**
 * Add the trailing slash to a URL that already carries an origin.
 *
 * Our pages are served as directory indexes, so a slashless URL costs the visitor a 301 hop.
 * `addTrailingSlash` deliberately leaves absolute URLs alone because they are usually
 * third-party; this one is for absolute URLs we own and build ourselves. A query string is
 * skipped alongside an anchor, since the slash belongs before either.
 */
export function addAbsoluteTrailingSlash(url: string) {
    return url.endsWith('/') || url.includes('#') || url.includes('?') ? url : `${url}/`;
}
