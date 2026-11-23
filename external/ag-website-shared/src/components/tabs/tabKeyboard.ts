/**
 * The tab a key moves to under the WAI-ARIA tabs pattern, or `undefined` for keys it ignores.
 */
export function getTabIndexForKey(key: string, currentIndex: number, count: number): number | undefined {
    switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
            return (currentIndex + 1) % count;
        case 'ArrowLeft':
        case 'ArrowUp':
            return (currentIndex - 1 + count) % count;
        case 'Home':
            return 0;
        case 'End':
            return count - 1;
        default:
            return undefined;
    }
}
