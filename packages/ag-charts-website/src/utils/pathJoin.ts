interface Params {
    path: (string | URL | undefined)[];
}

/**
 * Join path segments.
 *
 * Works on server and client side
 */
export function pathJoin(params?: Params): string {
    if (!params) {
        return '';
    }

    const { path } = params;
    const segments = path as string[];
    if (!segments || !segments.length) {
        return '';
    } else if (segments[0] === '/' && segments.length === 1) {
        return '/';
    }

    const removedSlashes = segments
        .filter(Boolean)
        // Convert segments to string, in case it's a URL
        .map((segment) => segment!.toString())
        // Remove initial /
        .map((segment) => {
            return segment !== '/' && segment[0] === '/' ? segment.slice(1) : segment;
        })
        // Remove end slash /
        .map((segment) => {
            return segment !== '/' && segment[segment.length - 1] === '/'
                ? segment.slice(0, segment.length - 1)
                : segment;
        })
        .filter((segment) => {
            return segment !== '/';
        });

    const [firstSegment] = segments;
    const firstSegmentHasSlash = firstSegment?.[0] === '/';
    return firstSegmentHasSlash ? `/${removedSlashes.join('/')}` : removedSlashes.join('/');
}
