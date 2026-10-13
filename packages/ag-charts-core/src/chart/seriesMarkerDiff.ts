/** Marker keys that restyle in place; every other marker change rebuilds the marker nodes. */
const MARKER_RESTYLE_KEYS = new Set(['lineDash', 'lineDashOffset']);

export function markerRebuildNeeded(markerDiff: object | undefined): boolean {
    return markerDiff != null && Object.keys(markerDiff).some((key) => !MARKER_RESTYLE_KEYS.has(key));
}
