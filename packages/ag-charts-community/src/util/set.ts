export function hasIntersection<T>(a?: Set<T> | Map<T, any>, b?: Set<T> | Map<T, any>) {
    if (!a?.size || !b?.size) {
        return false;
    }
    for (const entry of a.keys()) {
        if (b.has(entry)) {
            return true;
        }
    }
    return false;
}
