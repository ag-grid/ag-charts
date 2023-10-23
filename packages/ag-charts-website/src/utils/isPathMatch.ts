interface Params {
    path: string[];
    pathItem: string;
    /**
     * A `.` separated string for matching the path
     *
     * A wildcard `*` can be used to represent any value at that position.
     * If a wildcard is at the end it will match all path items from that position onwards
     */
    pathMatcher: string;
}

export function isPathMatch({ path, pathMatcher, pathItem }: Params): boolean {
    if (pathMatcher === '') {
        return false;
    }

    let matches = false;
    const matcherPath = pathMatcher.split('.');
    const checkPath = path.concat(pathItem);

    for (let i = 0; i < matcherPath.length; i++) {
        const matcherItem = matcherPath[i];
        const pathItem = checkPath[i];
        const isWildcard = matcherItem === '*';

        // Wildcard matches any value, but if not wildcard, check item
        if (!isWildcard) {
            matches = matcherItem === pathItem;
            if (!matches) {
                break;
            }
        }

        // At the end
        if (i === matcherPath.length - 1) {
            matches = isWildcard
                ? true
                : // If not a wildcard and there is more in the path to check, then it does not match
                  checkPath.length <= i + 1;
        }
    }

    return matches;
}
