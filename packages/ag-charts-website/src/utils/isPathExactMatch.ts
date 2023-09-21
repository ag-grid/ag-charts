interface Params {
    path: string[];
    pathItem: string;
    /**
     * A `.` separated string for matching the path
     *
     * A wildcard `*` can be used to represent any value
     */
    pathMatcher: string;
}

export function isPathExactMatch({ path, pathMatcher, pathItem }: Params): boolean {
    if (pathMatcher === '') {
        return false;
    }

    let matches = false;
    const matcherPath = pathMatcher.split('.');
    const checkPath = path.concat(pathItem);

    if (matcherPath.length !== checkPath.length) {
        return false;
    }

    for (let i = 0; i < matcherPath.length; i++) {
        const matcherItem = matcherPath[i];
        const pathItem = checkPath[i];

        // Wildcard match any value
        if (matcherItem === '*') {
            matches = true;
        } else {
            matches = matcherItem === pathItem;
            if (!matches) {
                break;
            }
        }
    }

    return matches;
}
