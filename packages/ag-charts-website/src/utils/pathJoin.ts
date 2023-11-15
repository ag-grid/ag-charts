interface Params {
    path: (string | URL | undefined)[];
    addTrailingSlash?: boolean;
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

    const { path, addTrailingSlash } = params;
    const segments = path as string[];
    if (!segments || !segments.length) {
        return '';
    }

    const initialClean = segments
        .filter(Boolean)
        // Convert segments to string, in case it's a URL
        .map((segment) => segment!.toString())
        // Remove initial /
        .map((segment) => {
            return segment !== '/' && segment[0] === '/' ? segment.slice(1) : segment;
        });

    if (initialClean[0] === '/' && initialClean.length === 1) {
        return '/';
    }

    const initialJoin = initialClean.join('/');
    const hasTrailingSlash = initialJoin[initialJoin.length - 1] === '/';

    const removedSlashes = initialClean
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
    const withInitialSlash = firstSegmentHasSlash ? `/${removedSlashes.join('/')}` : removedSlashes.join('/');

    let output = withInitialSlash;
    if ((addTrailingSlash && !hasTrailingSlash) || hasTrailingSlash) {
        output = withInitialSlash + '/';
    }

    return output;
}
