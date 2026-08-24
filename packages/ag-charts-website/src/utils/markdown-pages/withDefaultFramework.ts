import { DEFAULT_FRAMEWORK, FRAMEWORK_REDIRECT_PATH } from '@constants';

const REDIRECT_PREFIX = `/${FRAMEWORK_REDIRECT_PATH}/`;

/**
 * Swap the framework agnostic segment of a docs url (`/r/{page}`) for the default framework.
 *
 * `/r/{page}` is a stub that redirects the visitor, client side, to whichever framework they
 * last used, which makes it the right target for the site's own pages but not for their `.md`
 * twins: those are read by tools that don't run the redirect, and there is no `/r/{page}.md`
 * for them to be sent on to. Urls that aren't framework redirects are returned unchanged.
 */
export function withDefaultFramework(url: string): string {
    if (!url.startsWith(REDIRECT_PREFIX)) {
        return url;
    }
    return `/${DEFAULT_FRAMEWORK}/${url.slice(REDIRECT_PREFIX.length)}`;
}
