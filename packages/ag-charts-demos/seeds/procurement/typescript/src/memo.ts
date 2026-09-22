/**
 * A `useMemo` stand-in for a port with no render loop: the function runs again only when an
 * argument changes identity, so the values it returns keep theirs and the children reading them
 * can skip work exactly where the React components' memoised options would not have changed.
 */
export function memo<A extends unknown[], R>(compute: (...args: A) => R): (...args: A) => R {
    let last: A | undefined;
    let value: R;
    return (...args: A) => {
        if (last === undefined || args.length !== last.length || args.some((arg, index) => arg !== last![index])) {
            last = args;
            value = compute(...args);
        }
        return value;
    };
}
