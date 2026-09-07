import type { Position } from 'ag-charts-core';

import {
    maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment,
    polygonFitRegion,
    xExtentsOfRectConstrainedByCenterAndHeightToLineSegment,
} from './polygonLabelUtil';

describe('maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment', () => {
    test('Top intersection', () => {
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([-1, -1], [1, -3], 0, 0, 2)).toBe(4);
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([1, -3], [-1, -1], 0, 0, 2)).toBe(4);
    });

    test('Bottom intersection', () => {
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([-1, 1], [1, 3], 0, 0, 2)).toBe(4);
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([1, 3], [-1, 1], 0, 0, 2)).toBe(4);
    });

    test('Left intersection', () => {
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([-3, 1], [-5, -1], 0, 0, 2)).toBe(6);
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([-5, -1], [-3, 1], 0, 0, 2)).toBe(6);
    });

    test('Right intersection', () => {
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([3, 1], [5, -1], 0, 0, 2)).toBe(6);
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([5, -1], [3, 1], 0, 0, 2)).toBe(6);
    });

    test('Top right intersection', () => {
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([0, -2], [2, 0], 0, 0, 2)).toBe(2 + 2 / 3);
        expect(maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment([3, -1], [1, 1], 0, 0, 2)).toBe(2 + 2 / 3);
    });

    test('Real cases', () => {
        expect(
            maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment(
                [183.33757025661066, 337.4861921450947],
                [183.33757025661066, 320.23561470865684],
                244.62282568201414,
                354.32237241480544,
                1.9576822916666667
            )
        ).toBe(122.57051085080688);
    });
});

describe('xExtentsOfRectConstrainedByCenterAndHeightToLineSegment', () => {
    test('Left intersection', () => {
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [-3, 1],
                [-5, -1],
                0,
                0,
                10
            )
        ).toEqual({
            minX: -3,
            maxX: Infinity,
        });
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [-5, -1],
                [-3, 1],
                0,
                0,
                10
            )
        ).toEqual({
            minX: -3,
            maxX: Infinity,
        });
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [-3, -10],
                [-3, 10],
                0,
                0,
                1
            )
        ).toEqual({
            minX: -3,
            maxX: Infinity,
        });
    });

    test('Right intersection', () => {
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [3, 1],
                [5, -1],
                0,
                0,
                10
            )
        ).toEqual({
            minX: -Infinity,
            maxX: 3,
        });
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [5, -1],
                [3, 1],
                0,
                0,
                10
            )
        ).toEqual({
            minX: -Infinity,
            maxX: 3,
        });
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [3, -10],
                [3, 10],
                0,
                0,
                1
            )
        ).toEqual({
            minX: -Infinity,
            maxX: 3,
        });
    });

    test('Top intersection', () => {
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [2, 2],
                [4, 0],
                0,
                0,
                2
            )
        ).toEqual({
            minX: -Infinity,
            maxX: 3,
        });
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [-2, 2],
                [-4, 0],
                0,
                0,
                2
            )
        ).toEqual({
            minX: -3,
            maxX: Infinity,
        });
    });

    test('Bottom intersection', () => {
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [2, -2],
                [4, 0],
                0,
                0,
                2
            )
        ).toEqual({
            minX: -Infinity,
            maxX: 3,
        });
        expect(
            xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                { minX: -Infinity, maxX: Infinity },
                [-2, -2],
                [-4, 0],
                0,
                0,
                2
            )
        ).toEqual({
            minX: -3,
            maxX: Infinity,
        });
    });
});

describe('polygonFitRegion', () => {
    test('rectangle offers its full extent on every band', () => {
        const region = polygonFitRegion(
            [
                [
                    [0, 0],
                    [10, 0],
                    [10, 6],
                    [0, 6],
                ],
            ],
            4,
            2
        );
        expect(region.extentAbove).toBe(2);
        expect(region.extentBelow).toBe(4);
        expect(region.spanAt(-1, 1)).toEqual([-4, 6]);
        expect(region.spanAt(2, 4)).toEqual([-4, 6]);
    });

    test('an anchor on a vertical edge has no room above or below it', () => {
        const region = polygonFitRegion(
            [
                [
                    [0, 0],
                    [10, 0],
                    [10, 10],
                    [0, 10],
                ],
            ],
            0,
            5
        );
        expect(region.extentAbove).toBe(0);
        expect(region.extentBelow).toBe(0);
    });

    test('triangle narrows towards its apex', () => {
        // Apex at (5, 0), base from (0, 10) to (10, 10); anchored on the centre line.
        const region = polygonFitRegion(
            [
                [
                    [5, 0],
                    [10, 10],
                    [0, 10],
                ],
            ],
            5,
            6
        );
        expect(region.extentAbove).toBe(6);
        expect(region.extentBelow).toBe(4);
        // A band's room is set by its narrowest row, the top one: half-width at y is y / 2.
        expect(region.spanAt(-2, 0)).toEqual([-2, 2]);
        expect(region.spanAt(0, 2)).toEqual([-3, 3]);
        expect(region.spanAt(2, 4)).toEqual([-4, 4]);
    });

    test('concave polygon stops at the notch on the side that has it', () => {
        // A 10x6 rectangle with a notch cut in from the right between y=2 and y=4, down to x=7.
        const notched: Position[][] = [
            [
                [0, 0],
                [10, 0],
                [10, 2],
                [7, 2],
                [7, 4],
                [10, 4],
                [10, 6],
                [0, 6],
            ],
        ];
        const region = polygonFitRegion(notched, 3, 3);
        expect(region.spanAt(-0.5, 0.5)).toEqual([-3, 4]);
        expect(region.spanAt(-2.5, -1.5)).toEqual([-3, 7]);
    });

    test('memoises a band and reports no room for a band the polygon cannot bound', () => {
        const region = polygonFitRegion(
            [
                [
                    [0, 0],
                    [10, 0],
                    [10, 6],
                    [0, 6],
                ],
            ],
            4,
            2
        );
        expect(region.spanAt(-1, 1)).toBe(region.spanAt(-1, 1));
        // An open ring cannot bound the band on its right, so it offers nothing rather than infinity.
        const open = polygonFitRegion(
            [
                [
                    [0, 0],
                    [0, 6],
                ],
            ],
            4,
            2
        );
        expect(open.spanAt(-1, 1)).toEqual([0, 0]);
    });
});
