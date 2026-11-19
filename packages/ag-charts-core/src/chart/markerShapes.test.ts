import { describe, expect, it } from 'vitest';

import type { AgMarkerShapeFn } from 'ag-charts-types';

import { markerShapeAnchor } from './markerShapes';

describe('markerShapeAnchor', () => {
    const shapeWith = (anchor: object): AgMarkerShapeFn => {
        const shape: AgMarkerShapeFn = ({ path, x, y }) => path.moveTo(x, y);
        return Object.assign(shape, { anchor });
    };

    it.each([
        { case: 'numeric', anchor: { x: 0.25, y: 1 }, expected: { x: 0.25, y: 1 } },
        { case: 'non-numeric', anchor: { x: '0.25', y: null }, expected: { x: 0.5, y: 0.5 } },
    ])('reads a custom shape by its $case anchor', ({ anchor, expected }) => {
        expect(markerShapeAnchor(shapeWith(anchor))).toEqual(expected);
    });
});
