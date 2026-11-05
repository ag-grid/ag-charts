import type { Point } from 'ag-charts-core';

import { AnnotationType } from '../annotationTypes';

/** The share of the series area, in each dimension, covered by an annotation created with the keyboard. */
const KEYBOARD_CREATE_SIZE_RATIO = 1 / 3;

/** The distance, in pixels, between a callout's handles in each dimension. */
const KEYBOARD_CREATE_CALLOUT_SPAN = 20;

/** How many points a creation gesture takes and where in the centred box they go. */
type KeyboardCreateShape = 'point' | 'diagonal' | 'callout' | 'parallel-channel' | 'disjoint-channel' | 'trend';

const KEYBOARD_CREATE_SHAPES: Record<AnnotationType, KeyboardCreateShape> = {
    [AnnotationType.HorizontalLine]: 'point',
    [AnnotationType.VerticalLine]: 'point',
    [AnnotationType.Comment]: 'point',
    [AnnotationType.Note]: 'point',
    [AnnotationType.Text]: 'point',
    [AnnotationType.ArrowUp]: 'point',
    [AnnotationType.ArrowDown]: 'point',

    [AnnotationType.Callout]: 'callout',

    [AnnotationType.Line]: 'diagonal',
    [AnnotationType.Arrow]: 'diagonal',
    [AnnotationType.FibonacciRetracement]: 'diagonal',
    [AnnotationType.DateRange]: 'diagonal',
    [AnnotationType.PriceRange]: 'diagonal',
    [AnnotationType.DatePriceRange]: 'diagonal',
    [AnnotationType.QuickDatePriceRange]: 'diagonal',

    [AnnotationType.ParallelChannel]: 'parallel-channel',
    [AnnotationType.DisjointChannel]: 'disjoint-channel',

    [AnnotationType.FibonacciRetracementTrendBased]: 'trend',
};

/**
 * The offsets, relative to the series area, of the points that create an annotation of the given type without a
 * pointer, in the order the creation gesture takes them. Annotations without a size get a single point at the centre,
 * the others span a box a third of the series area wide and high, centred in it, apart from a callout, which is small.
 */
export function getKeyboardCreateOffsets(type: AnnotationType, seriesSize: { width: number; height: number }) {
    const { width, height } = seriesSize;
    const boxWidth = width * KEYBOARD_CREATE_SIZE_RATIO;
    const boxHeight = height * KEYBOARD_CREATE_SIZE_RATIO;

    const centre: Point = { x: width / 2, y: height / 2 };
    const left = centre.x - boxWidth / 2;
    const right = centre.x + boxWidth / 2;
    const top = centre.y - boxHeight / 2;
    const bottom = centre.y + boxHeight / 2;

    switch (KEYBOARD_CREATE_SHAPES[type]) {
        case 'point':
            return [centre];
        case 'diagonal':
            return [
                { x: left, y: bottom },
                { x: right, y: top },
            ];
        case 'callout':
            return [
                { x: centre.x - KEYBOARD_CREATE_CALLOUT_SPAN / 2, y: centre.y + KEYBOARD_CREATE_CALLOUT_SPAN / 2 },
                { x: centre.x + KEYBOARD_CREATE_CALLOUT_SPAN / 2, y: centre.y - KEYBOARD_CREATE_CALLOUT_SPAN / 2 },
            ];
        case 'parallel-channel':
            // The last point sets the height, so the channel's lower edge ends at the bottom of the box
            return [
                { x: left, y: centre.y },
                { x: right, y: top },
                { x: right, y: centre.y },
            ];
        case 'disjoint-channel':
            // A quarter down puts the start at half the end height, centring the channel on it.
            return [
                { x: left, y: centre.y - boxHeight / 4 },
                { x: right, y: top },
                { x: right, y: bottom },
            ];
        case 'trend':
            return [
                { x: left, y: bottom },
                { x: centre.x, y: top },
                { x: right, y: centre.y },
            ];
    }
}
