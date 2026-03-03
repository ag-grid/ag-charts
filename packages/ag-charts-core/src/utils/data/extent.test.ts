import { extent, normalisedExtentWithMetadata, normalisedTimeExtentWithMetadata } from './extent';

describe('extent module', () => {
    describe('extent with isContinuous', () => {
        test('returns lowest and highest numbers from list of numbers', () => {
            {
                const result = extent([3, 7, 1, 2, 9, -2]);
                expect(result?.[0]).toBe(-2);
                expect(result?.[1]).toBe(9);
            }
            {
                const result = extent([0, 13, 10, 19]);
                expect(result?.[0]).toBe(0);
                expect(result?.[1]).toBe(19);
            }
            {
                const result = extent([null as any, 0, 13, 10, 19]);
                expect(result?.[0]).toBe(0);
                expect(result?.[1]).toBe(19);
            }
        });

        test('returns undefined for list of invalid values', () => {
            const result = extent([Number.NaN, null, undefined] as any[]);
            expect(result).toBe(null);
        });

        test('returns undefined for empty list', () => {
            const result = extent([]);
            expect(result).toBe(null);
        });

        test('returns same lowest and highest number for single number', () => {
            const result = extent([5]);
            expect(result?.[0]).toBe(5);
            expect(result?.[1]).toBe(5);
        });

        test('returns valid lowest and highest number from mixed values', () => {
            const result = extent([undefined, 4, 3, 7, null, {}, 1, 5] as any);
            expect(result?.[0]).toBe(1);
            expect(result?.[1]).toBe(7);
        });

        test('does not coerce objects', () => {
            const result = extent([{ toString: () => '2' }, { toString: () => '1' }] as any);
            expect(result).toBe(null);
        });

        test('coerces Dates to numbers', () => {
            const earliest = 5270400000;
            const latest = 1568332800000;

            const result = extent(
                [new Date(earliest), new Date(latest), new Date(1985, 5, 5)].map((d) => d.getTime())
            )!.map((x) => Number(x));

            expect(result?.[0]).toBe(earliest);
            expect(result?.[1]).toBe(latest);
        });

        test('returns earliest and latest timestamp for mixed Dates and numbers', () => {
            const earliest = 5270400000;
            const latest = 1568468277000;

            const result = extent([new Date(2019, 7, 20), new Date(earliest), latest, new Date(1985, 5, 5)])!.map((x) =>
                Number(x)
            );

            expect(result?.[0]).toBe(earliest);
            expect(result?.[1]).toBe(latest);
        });
    });

    describe('normalisedExtentWithMetadata', () => {
        test('expands extents to include min/max', () => {
            const result = normalisedExtentWithMetadata([-50, -20, 0, 30, 50], -80, 75);
            expect(result.extent[0]).toBe(-80);
            expect(result.extent[1]).toBe(75);
            expect(result.clipped).toBe(true);
        });

        test('expands extents to include preferredMin/preferredMax', () => {
            const result = normalisedExtentWithMetadata([-50, -20, 0, 30, 50], undefined, undefined, -65, 60);
            expect(result.extent[0]).toBe(-65);
            expect(result.extent[1]).toBe(60);
            expect(result.clipped).toBe(false);
        });

        test('contracts extents when min/max within domain', () => {
            const result = normalisedExtentWithMetadata([-50, -20, 0, 30, 50], -30, 45);
            expect(result.extent[0]).toBe(-30);
            expect(result.extent[1]).toBe(45);
            expect(result.clipped).toBe(true);
        });

        test('does not contract extents when preferredMin/preferredMax within domain', () => {
            const result = normalisedExtentWithMetadata([-50, -20, 0, 30, 50], undefined, undefined, -30, 45);
            expect(result.extent[0]).toBe(-50);
            expect(result.extent[1]).toBe(50);
            expect(result.clipped).toBe(false);
        });

        test('prioritises min/max over preferredMin/preferredMax', () => {
            const result = normalisedExtentWithMetadata([-50, -20, 0, 30, 50], -30, 70, -65, 60);
            expect(result.extent[0]).toBe(-30);
            expect(result.extent[1]).toBe(70);
            expect(result.clipped).toBe(true);
        });

        test('clipped when only min is set', () => {
            const result = normalisedExtentWithMetadata([-50, -20, 0, 30, 50], -30, undefined);
            expect(result.extent[0]).toBe(-30);
            expect(result.extent[1]).toBe(50);
            expect(result.clipped).toBe(true);
        });

        test('clipped when only max is set', () => {
            const result = normalisedExtentWithMetadata([-50, -20, 0, 30, 50], undefined, 45);
            expect(result.extent[0]).toBe(-50);
            expect(result.extent[1]).toBe(45);
            expect(result.clipped).toBe(true);
        });
    });

    describe('normalisedTimeExtentWithMetadata', () => {
        test('expands extents to include min/max', () => {
            const result = normalisedTimeExtentWithMetadata(
                {
                    domain: [
                        new Date(2019, 0, 1),
                        new Date(2020, 0, 1),
                        new Date(2021, 0, 1),
                        new Date(2022, 0, 1),
                        new Date(2023, 0, 1),
                    ],
                },
                new Date(2018, 0, 1),
                new Date(2024, 0, 1)
            );
            expect(result.extent[0]).toStrictEqual(new Date(2018, 0, 1));
            expect(result.extent[1]).toStrictEqual(new Date(2024, 0, 1));
            expect(result.clipped).toBe(true);
        });

        test('expands extents to include preferredMin/preferredMax', () => {
            const result = normalisedTimeExtentWithMetadata(
                {
                    domain: [
                        new Date(2019, 0, 1),
                        new Date(2020, 0, 1),
                        new Date(2021, 0, 1),
                        new Date(2022, 0, 1),
                        new Date(2023, 0, 1),
                    ],
                },
                undefined,
                undefined,
                new Date(2018, 0, 1),
                new Date(2024, 0, 1)
            );
            expect(result.extent[0]).toStrictEqual(new Date(2018, 0, 1));
            expect(result.extent[1]).toStrictEqual(new Date(2024, 0, 1));
            expect(result.clipped).toBe(false);
        });

        test('contracts extents when min/max within domain', () => {
            const result = normalisedTimeExtentWithMetadata(
                {
                    domain: [
                        new Date(2019, 0, 1),
                        new Date(2020, 0, 1),
                        new Date(2021, 0, 1),
                        new Date(2022, 0, 1),
                        new Date(2023, 0, 1),
                    ],
                },
                new Date(2019, 6, 1),
                new Date(2022, 6, 1)
            );
            expect(result.extent[0]).toStrictEqual(new Date(2019, 6, 1));
            expect(result.extent[1]).toStrictEqual(new Date(2022, 6, 1));
            expect(result.clipped).toBe(true);
        });

        test('does not contract extents when preferredMin/preferredMax within domain', () => {
            const result = normalisedTimeExtentWithMetadata(
                {
                    domain: [
                        new Date(2019, 0, 1),
                        new Date(2020, 0, 1),
                        new Date(2021, 0, 1),
                        new Date(2022, 0, 1),
                        new Date(2023, 0, 1),
                    ],
                },
                undefined,
                undefined,
                new Date(2019, 6, 1),
                new Date(2022, 6, 1)
            );
            expect(result.extent[0]).toStrictEqual(new Date(2019, 0, 1));
            expect(result.extent[1]).toStrictEqual(new Date(2023, 0, 1));
            expect(result.clipped).toBe(false);
        });

        test('prioritises min/max over preferredMin/preferredMax', () => {
            const result = normalisedTimeExtentWithMetadata(
                {
                    domain: [
                        new Date(2019, 0, 1),
                        new Date(2020, 0, 1),
                        new Date(2021, 0, 1),
                        new Date(2022, 0, 1),
                        new Date(2023, 0, 1),
                    ],
                },
                new Date(2019, 6, 1),
                new Date(2022, 6, 1),
                new Date(2018, 0, 1),
                new Date(2024, 0, 1)
            );
            expect(result.extent[0]).toStrictEqual(new Date(2019, 6, 1));
            expect(result.extent[1]).toStrictEqual(new Date(2022, 6, 1));
            expect(result.clipped).toBe(true);
        });
    });
});
