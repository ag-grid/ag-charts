import {
    maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment,
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
