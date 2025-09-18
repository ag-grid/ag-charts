import { _ModuleSupport } from 'ag-charts-community';

import { findRangeAreaIntersections } from './rangeAreaIntersection';

describe('Range Area Intersection', () => {
    test('should find intersection between crossing high and low spans', () => {
        // Create test spans where high and low lines cross
        const highSpans: _ModuleSupport.LinePathSpan[] = [
            {
                span: { type: 'linear', moveTo: true, x0: 0, y0: 10, x1: 10, y1: 0 },
                xValue0: 0,
                yValue0: 10,
                xValue1: 10,
                yValue1: 0,
            },
        ];

        const lowSpans: _ModuleSupport.LinePathSpan[] = [
            {
                span: { type: 'linear', moveTo: true, x0: 0, y0: 0, x1: 10, y1: 10 },
                xValue0: 0,
                yValue0: 0,
                xValue1: 10,
                yValue1: 10,
            },
        ];

        // Calculate initial inversion state from the spans' starting y-values
        const initiallyInverted = highSpans[0].yValue0 > lowSpans[0].yValue0;
        const intersections = findRangeAreaIntersections(highSpans, lowSpans, 0, 10, initiallyInverted);

        expect(intersections).toHaveLength(1);
        expect(intersections[0]).toBeCloseTo(5);
    });

    test('should find no intersections for non-crossing spans', () => {
        // Create test spans where high stays above low
        const highSpans: _ModuleSupport.LinePathSpan[] = [
            {
                span: { type: 'linear', moveTo: true, x0: 0, y0: 10, x1: 10, y1: 8 },
                xValue0: 0,
                yValue0: 10,
                xValue1: 10,
                yValue1: 8,
            },
        ];

        const lowSpans: _ModuleSupport.LinePathSpan[] = [
            {
                span: { type: 'linear', moveTo: true, x0: 0, y0: 2, x1: 10, y1: 4 },
                xValue0: 0,
                yValue0: 2,
                xValue1: 10,
                yValue1: 4,
            },
        ];

        // Calculate initial inversion state from the spans' starting y-values
        const initiallyInverted = highSpans[0].yValue0 > lowSpans[0].yValue0;
        const intersections = findRangeAreaIntersections(highSpans, lowSpans, 0, 10, initiallyInverted);
        expect(intersections).toHaveLength(0);
    });

    test('should get intersection x-values', () => {
        const highSpans: _ModuleSupport.LinePathSpan[] = [
            {
                span: { type: 'linear', moveTo: true, x0: 0, y0: 10, x1: 10, y1: 0 },
                xValue0: 0,
                yValue0: 10,
                xValue1: 10,
                yValue1: 0,
            },
        ];

        const lowSpans: _ModuleSupport.LinePathSpan[] = [
            {
                span: { type: 'linear', moveTo: true, x0: 0, y0: 0, x1: 10, y1: 10 },
                xValue0: 0,
                yValue0: 0,
                xValue1: 10,
                yValue1: 10,
            },
        ];

        // Calculate initial inversion state from the spans' starting y-values
        const initiallyInverted = highSpans[0].yValue0 > lowSpans[0].yValue0;
        const xValues = findRangeAreaIntersections(highSpans, lowSpans, 0, 10, initiallyInverted);

        expect(xValues).toHaveLength(1);
        expect(xValues[0]).toBeCloseTo(5);
    });
});
