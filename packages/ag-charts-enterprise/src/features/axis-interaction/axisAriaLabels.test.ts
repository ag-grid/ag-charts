import { describe, expect, it } from 'vitest';

import { type AxisAriaLabelSource, resolveAxisAriaLabels } from './axisAriaLabels';

// axisId is derived from the key so that expectations can be read by key.
const src = (userAxisId: string, extra: Partial<AxisAriaLabelSource> = {}): AxisAriaLabelSource => ({
    axisId: `__AXIS_ID_${userAxisId}`,
    userAxisId,
    ...extra,
});

const resolve = (...sources: AxisAriaLabelSource[]) => {
    const { labels, duplicateExplicitLabels } = resolveAxisAriaLabels(sources);
    return { labels: sources.map((s) => labels.get(s.axisId)), duplicateExplicitLabels };
};

describe('resolveAxisAriaLabels', () => {
    it('falls back from ariaLabel to title text to axis key', () => {
        const { labels, duplicateExplicitLabels } = resolve(
            src('a', { ariaLabel: 'Explicit', titleText: 'Title' }),
            src('b', { titleText: 'Title B' }),
            src('c')
        );
        expect(labels).toEqual(['Explicit', 'Title B', 'c']);
        expect(duplicateExplicitLabels).toEqual([]);
    });

    it('treats an empty ariaLabel as unset', () => {
        expect(resolve(src('x', { ariaLabel: '', titleText: 'Title' })).labels).toEqual(['Title']);
        expect(resolve(src('x', { ariaLabel: '' })).labels).toEqual(['x']);
    });

    it('treats a whitespace-only ariaLabel as unset', () => {
        expect(resolve(src('x', { ariaLabel: '   ', titleText: 'Price' })).labels).toEqual(['Price']);
        expect(resolve(src('x', { ariaLabel: ' \n\t' })).labels).toEqual(['x']);
    });

    it('suffixes derived labels that differ only in whitespace', () => {
        expect(resolve(src('y', { titleText: 'Value' }), src('y2', { titleText: ' Value ' })).labels).toEqual([
            'Value (y)',
            ' Value  (y2)',
        ]);
        expect(
            resolve(src('y', { titleText: 'Total value' }), src('y2', { titleText: 'Total\n  value' })).labels
        ).toEqual(['Total value (y)', 'Total\n  value (y2)']);
    });

    it('reports explicit labels that differ only in whitespace as duplicates', () => {
        const { duplicateExplicitLabels } = resolve(src('a', { ariaLabel: 'Same' }), src('b', { ariaLabel: ' Same ' }));
        expect(duplicateExplicitLabels).toEqual(['Same', ' Same ']);
    });

    it('suffixes derived labels that collide, case-insensitively', () => {
        const { labels } = resolve(src('y', { titleText: 'Value' }), src('y2', { titleText: 'VALUE' }));
        expect(labels).toEqual(['Value (y)', 'VALUE (y2)']);
    });

    it('suffixes a title equal to another axis key', () => {
        const { labels } = resolve(src('x'), src('y', { titleText: 'x' }));
        // Both are derived and share a base label, so both are suffixed.
        expect(labels).toEqual(['x (x)', 'x (y)']);
        expect(new Set(labels.map((l) => l!.toLowerCase())).size).toBe(2);
    });

    it('leaves the explicit label unchanged and suffixes the colliding derived one', () => {
        const { labels, duplicateExplicitLabels } = resolve(
            src('a', { ariaLabel: 'Value' }),
            src('b', { titleText: 'Value' })
        );
        expect(labels).toEqual(['Value', 'Value (b)']);
        expect(duplicateExplicitLabels).toEqual([]);
    });

    it('keeps labels unique after a residual collision', () => {
        const { labels } = resolve(
            src('y', { titleText: 'Value' }),
            src('y2', { titleText: 'Value' }),
            src('y3', { titleText: 'Value (y2)' })
        );
        expect(labels).toHaveLength(3);
        expect(new Set(labels.map((l) => l!.toLowerCase())).size).toBe(3);
        // The unambiguous label is not rewritten; the clashing ones fall back to their keys.
        expect(labels).toEqual(['Value (y)', 'y2', 'y3']);
    });

    it('numbers residual collisions that clash with an existing key', () => {
        const { labels } = resolve(
            src('y', { titleText: 'Value' }),
            src('y2', { titleText: 'Value' }),
            src('y3', { titleText: 'Value (y2)' }),
            src('Y2', { titleText: 'Value (y2)' })
        );
        expect(new Set(labels.map((l) => l!.toLowerCase())).size).toBe(4);
    });

    it('keeps duplicate explicit labels verbatim and reports them once', () => {
        const { labels, duplicateExplicitLabels } = resolve(
            src('a', { ariaLabel: 'Same' }),
            src('b', { ariaLabel: 'Same' }),
            src('c', { ariaLabel: 'Other' })
        );
        expect(labels).toEqual(['Same', 'Same', 'Other']);
        expect(duplicateExplicitLabels).toEqual(['Same']);
    });
});
