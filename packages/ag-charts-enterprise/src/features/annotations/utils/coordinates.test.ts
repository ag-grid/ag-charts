import { describe, expect, it } from 'vitest';

import {
    BandScale,
    CategoryScale,
    GroupedCategoryScale,
    LinearScale,
    LogScale,
    OrdinalTimeScale,
    TimeScale,
    UnitTimeScale,
} from 'ag-charts-core';

import type { AnnotationAxisContext } from '../annotationTypes';
import { horizontalLineDatum, verticalLineDatum } from '../cross-line/crossLineDatum';
import { disjointChannelDatum } from '../disjoint-channel/disjointChannelDatum';
import { fibonacciRetracementTrendBasedDatum } from '../fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import { lineDatum } from '../line/lineDatum';
import { parallelChannelDatum } from '../parallel-channel/parallelChannelDatum';
import { type AxisOverrides, createAxesContext } from '../test/fixture';
import {
    displayCoordinate,
    floorToBand,
    formatCoordinate,
    getCoordinateFields,
    getCoordinateKind,
    parseCoordinate,
    resolveCoordinate,
    snapToBar,
} from './coordinates';
import { getGrouping } from './scale';

const numberScale = (domain: number[]) => {
    const scale = new LinearScale();
    scale.domain = domain;
    return scale;
};

const timeScale = (domain: Date[]) => {
    const scale = new TimeScale();
    scale.domain = domain;
    return scale;
};

const DAY = new Date(2024, 0, 5, 9, 30);

describe('annotation coordinates', () => {
    describe('getCoordinateKind', () => {
        it('reads each editable scale by its kind and leaves other band scales uneditable', () => {
            const kind = (scale: object) => getCoordinateKind({ scale: scale as AnnotationAxisContext['scale'] });

            expect(kind(numberScale([0, 10]))).toBe('number');
            expect(kind(timeScale([new Date(2024, 0, 1), new Date(2024, 0, 31)]))).toBe('time');
            expect(kind(new OrdinalTimeScale())).toBe('ordinal-time');
            expect(kind(new UnitTimeScale())).toBe('unit-time');
            expect(kind(new CategoryScale())).toBe('category');
            expect(kind(new GroupedCategoryScale())).toBeUndefined();
            expect(kind(Object.create(BandScale.prototype))).toBeUndefined();
        });
    });

    describe('formatCoordinate and parseCoordinate', () => {
        it('round-trips a number, keeping an integer beyond the safe range exact as a bigint', () => {
            expect(formatCoordinate(12.5, 'number')).toBe('12.5');
            expect(parseCoordinate('12.5', 'number')).toBe(12.5);
            expect(parseCoordinate(' 1e3 ', 'number')).toBe(1000);
            expect(parseCoordinate('9007199254740991', 'number')).toBe(9007199254740991);
            expect(parseCoordinate('9007199254740993', 'number')).toBe(9007199254740993n);
            expect(parseCoordinate('-9007199254740993', 'number')).toBe(-9007199254740993n);
            expect(formatCoordinate(9007199254740993n, 'number')).toBe('9007199254740993');

            for (const text of ['', '  ', 'abc', 'Infinity']) {
                expect(parseCoordinate(text, 'number')).toBeUndefined();
            }
        });

        it('round-trips a date as a local date-time, with milliseconds only when present', () => {
            const withMilliseconds = new Date(2024, 0, 5, 9, 30, 15, 70);

            expect(formatCoordinate(DAY, 'time')).toBe('2024-01-05T09:30:00');
            expect(parseCoordinate('2024-01-05T09:30:00', 'time')).toEqual(DAY);
            expect(formatCoordinate(withMilliseconds, 'time')).toBe('2024-01-05T09:30:15.070');
            expect(parseCoordinate('2024-01-05T09:30:15.070', 'time')).toEqual(withMilliseconds);

            for (const text of ['', 'not a date']) {
                expect(parseCoordinate(text, 'time')).toBeUndefined();
            }
        });

        it('formats a date down to a precision, and reads a date without a time as local midnight', () => {
            const date = new Date(2024, 6, 5, 9, 30, 15, 70);

            expect(formatCoordinate(date, 'time', 'day')).toBe('2024-07-05');
            expect(formatCoordinate(date, 'time', 'minute')).toBe('2024-07-05T09:30');
            expect(formatCoordinate(date, 'time', 'second')).toBe('2024-07-05T09:30:15');
            expect(formatCoordinate(date, 'time', 'millisecond')).toBe('2024-07-05T09:30:15.070');

            expect(parseCoordinate('2024-07-05', 'time')).toEqual(new Date(2024, 6, 5));
            expect(parseCoordinate('2024-07-05T09:30', 'time')).toEqual(new Date(2024, 6, 5, 9, 30));
        });

        it('formats the value of a grouped point, and a missing value as empty', () => {
            expect(formatCoordinate({ value: 3, groupPercentage: 0.5 }, 'number')).toBe('3');
            expect(formatCoordinate(undefined, 'number')).toBe('');
            expect(formatCoordinate(undefined, 'time')).toBe('');
        });
    });

    describe('getCoordinateFields', () => {
        const context = createAxesContext(numberScale([0, 100]), numberScale([0, 50]));
        const describeFields = (fields: ReturnType<typeof getCoordinateFields>) =>
            fields.map((f) => [f.row, f.axis, f.value]);

        it('lists the start and end of a line on number axes', () => {
            const datum = { ...lineDatum.create(), start: { x: 1, y: 2 }, end: { x: 3, y: 4 } };

            const fields = getCoordinateFields(datum, context);

            expect(describeFields(fields)).toEqual([
                ['start', 'x', '1'],
                ['start', 'y', '2'],
                ['end', 'x', '3'],
                ['end', 'y', '4'],
            ]);
            expect(fields[0].toProps(7)).toEqual({ start: { x: 7 } });
            expect(fields[3].toProps(9)).toEqual({ end: { y: 9 } });
        });

        it('adds the retracement end of a trend based fibonacci as a third point', () => {
            const datum = {
                ...fibonacciRetracementTrendBasedDatum.create(),
                start: { x: 1, y: 2 },
                end: { x: 3, y: 4 },
                endRetracement: { x: 5, y: 6 },
            };

            const fields = getCoordinateFields(datum, context);

            expect(describeFields(fields).slice(4)).toEqual([
                ['endRetracement', 'x', '5'],
                ['endRetracement', 'y', '6'],
            ]);
            expect(fields[5].toProps(9)).toEqual({ endRetracement: { y: 9 } });
        });

        it('omits the fields of an axis that is not editable', () => {
            const datum = { ...lineDatum.create(), start: { x: 'a', y: 2 }, end: { x: 'b', y: 4 } };

            const fields = getCoordinateFields(
                datum,
                createAxesContext(Object.create(BandScale.prototype), numberScale([0, 50]))
            );

            expect(fields.map((f) => [f.row, f.axis])).toEqual([
                ['start', 'y'],
                ['end', 'y'],
            ]);
        });

        it('types a time axis as time, stepping by the second or by the millisecond when the value has them', () => {
            const datum = {
                ...lineDatum.create(),
                start: { x: new Date(2024, 0, 5, 9, 30, 15, 70), y: 2 },
                end: { x: DAY, y: 4 },
            };

            const fields = getCoordinateFields(datum, createAxesContext(timeScale([DAY, DAY]), numberScale([0, 50])));
            const x = fields.filter((f) => f.axis === 'x');

            expect(x.map((f) => [f.kind, f.value, f.step])).toEqual([
                ['time', '2024-01-05T09:30:15.070', 0.001],
                ['time', '2024-01-05T09:30:00', 1],
            ]);
            expect(fields.filter((f) => f.axis === 'y').map((f) => f.step)).toEqual([undefined, undefined]);
        });

        it.each([
            ['day', 'day', '2024-01-05', undefined, new Date(2024, 1, 1, 9, 30, 15, 70)],
            [{ unit: 'month', step: 3 }, 'day', '2024-01-05', undefined, new Date(2024, 1, 1, 9, 30, 15, 70)],
            ['hour', 'minute', '2024-01-05T09:30', 60, new Date(2024, 1, 1, 12, 45, 15, 70)],
            [{ unit: 'minute', step: 15 }, 'minute', '2024-01-05T09:30', 60, new Date(2024, 1, 1, 12, 45, 15, 70)],
            [1000, 'second', '2024-01-05T09:30:15', 1, new Date(2024, 1, 1, 12, 45, 50, 70)],
            ['millisecond', 'millisecond', '2024-01-05T09:30:15.070', 0.001, new Date(2024, 1, 1, 12, 45, 50, 500)],
        ] as const)(
            'shows a time down to a tick size of %j, and keeps the finer parts of the value it replaces',
            (tickSize, precision, value, step, resolved) => {
                const datum = {
                    ...lineDatum.create(),
                    start: { x: new Date(2024, 0, 5, 9, 30, 15, 70), y: 2 },
                    end: { x: DAY, y: 4 },
                };
                const timeContext = createAxesContext(timeScale([DAY, DAY]), numberScale([0, 50]), String, {
                    x: { valueTickSize: () => tickSize },
                });

                const [startX] = getCoordinateFields(datum, timeContext);

                expect([startX.timePrecision, startX.value, startX.step]).toEqual([precision, value, step]);
                expect(resolveCoordinate(startX, new Date(2024, 1, 1, 12, 45, 50, 500), timeContext)).toEqual(resolved);
            }
        );

        it('lists the single value of a cross line on its own axis', () => {
            const horizontal = { ...horizontalLineDatum.create(), value: 20 };
            const vertical = { ...verticalLineDatum.create(), value: 30 };

            expect(describeFields(getCoordinateFields(horizontal, context))).toEqual([['value', 'y', '20']]);
            expect(describeFields(getCoordinateFields(vertical, context))).toEqual([['value', 'x', '30']]);
            expect(getCoordinateFields(horizontal, context)[0].toProps(5)).toEqual({ value: 5 });
        });

        it('adds the heights of a channel, only where the y axis is numeric', () => {
            const parallel = { ...parallelChannelDatum.create(), height: 12 };
            const disjoint = { ...disjointChannelDatum.create(), startHeight: 3, endHeight: 6 };
            const heights = (datum: typeof parallel | typeof disjoint, axes = context) =>
                getCoordinateFields(datum, axes).filter((f) => f.row.toLowerCase().endsWith('height'));

            const [height] = heights(parallel);
            expect(height.value).toBe('12');
            expect(height.toProps(8)).toEqual({ height: 8 });
            expect(height.toProps(9007199254740993n)).toEqual({ height: 9007199254740993n });
            expect(height.toProps('text')).toBeUndefined();

            const both = heights(disjoint);
            expect(both.map((f) => [f.row, f.value])).toEqual([
                ['startHeight', '3'],
                ['endHeight', '6'],
            ]);
            expect(both[1].toProps(1)).toEqual({ endHeight: 1 });
            expect(getCoordinateFields(disjoint, context).map((f) => f.row)).toEqual([
                'start',
                'start',
                'startHeight',
                'end',
                'end',
                'endHeight',
            ]);

            const timeY = timeScale([new Date(2024, 0, 1), new Date(2024, 0, 31)]);
            expect(heights(parallel, createAxesContext(numberScale([0, 100]), timeY))).toEqual([]);
        });
    });

    describe('resolveCoordinate', () => {
        it('takes a number or time beyond the domain of its axis, a bigint like a number, and a height of any size', () => {
            const context = createAxesContext(numberScale([0, 100]), numberScale([0, 50]));
            const datum = { ...lineDatum.create(), start: { x: 1, y: 2 }, end: { x: 3, y: 4 } };
            const [startX, startY] = getCoordinateFields(datum, context);

            expect(resolveCoordinate(startX, 100, context)).toBe(100);
            expect(resolveCoordinate(startY, 0, context)).toBe(0);
            expect(resolveCoordinate(startX, 100n, context)).toBe(100n);
            expect(resolveCoordinate(startX, 101, context)).toBe(101);
            expect(resolveCoordinate(startX, 101n, context)).toBe(101n);
            expect(resolveCoordinate(startY, -1, context)).toBe(-1);

            const timeContext = createAxesContext(timeScale([DAY, DAY]), timeScale([DAY, DAY]));
            const [timeX] = getCoordinateFields(datum, timeContext);
            const before = new Date(2000, 0, 1);
            expect(resolveCoordinate(timeX, before, timeContext)).toBe(before);

            const channel = { ...parallelChannelDatum.create(), height: 1 };
            const height = getCoordinateFields(channel, context).find((f) => f.row === 'height')!;
            expect(resolveCoordinate(height, 500, context)).toBe(500);
        });

        it('takes only values of the sign of the domain of a log axis, which cannot place any other', () => {
            const logScale = (domain: number[]) => {
                const scale = new LogScale();
                scale.domain = domain;
                return scale;
            };
            const datum = { ...lineDatum.create(), start: { x: 1, y: 2 }, end: { x: 3, y: 4 } };

            const positive = createAxesContext(numberScale([0, 100]), logScale([1, 1000]));
            const [, positiveY] = getCoordinateFields(datum, positive);
            expect(resolveCoordinate(positiveY, 5000, positive)).toBe(5000);
            expect(resolveCoordinate(positiveY, 0.01, positive)).toBe(0.01);
            expect(resolveCoordinate(positiveY, 0, positive)).toBeUndefined();
            expect(resolveCoordinate(positiveY, -5, positive)).toBeUndefined();
            expect(resolveCoordinate(positiveY, -5n, positive)).toBeUndefined();

            const negative = createAxesContext(numberScale([0, 100]), logScale([-1000, -1]));
            const [, negativeY] = getCoordinateFields(datum, negative);
            expect(resolveCoordinate(negativeY, -5, negative)).toBe(-5);
            expect(resolveCoordinate(negativeY, 0, negative)).toBeUndefined();
            expect(resolveCoordinate(negativeY, 5, negative)).toBeUndefined();
        });
    });

    describe('offset within a band', () => {
        const spacedReach = 0.5 + 0.5 / 0.7;
        const categories = (paddingInner: number) => {
            const scale = new CategoryScale<string>();
            scale.domain = ['Apples', 'Pears', 'Plums'];
            scale.range = [0, 300];
            scale.paddingInner = paddingInner;
            return scale;
        };

        // A band's group percentage runs from its start and a point's from itself; an offset is a share of the step.
        it.each([
            { name: 'bands', paddingInner: 0, groups: [0.25, 0], shown: ['-25', '-50'], reach: [0, 1] },
            {
                name: 'padded bands',
                paddingInner: 0.3,
                groups: [0.25, 0],
                shown: ['-17.5', '-35'],
                reach: [1 - spacedReach, spacedReach],
            },
            {
                name: 'bands with no width',
                paddingInner: 1,
                groups: [0.08, -0.08],
                shown: ['8', '-8'],
                reach: [-0.5, 0.5],
            },
        ])('maps an offset on $name to a group percentage and holds it to half a step either way', (row) => {
            const context = createAxesContext(categories(row.paddingInner), numberScale([0, 50]));
            const datum = {
                ...lineDatum.create(),
                start: { x: { value: 'Pears', groupPercentage: row.groups[0] }, y: 2 },
                end: { x: { value: 'Plums', groupPercentage: row.groups[1] }, y: 4 },
            };
            const fields = getCoordinateFields(datum, context);
            const offsets = fields.filter((f) => f.kind === 'offset');
            const groupAt = (offset: number) => getGrouping(offsets[0].toProps(offset)?.start?.x).groupPercentage;

            expect(fields.map((f) => [f.row, f.axis, f.kind])).toEqual([
                ['start', 'x', 'category'],
                ['start', 'y', 'number'],
                ['start', 'x', 'offset'],
                ['end', 'x', 'category'],
                ['end', 'y', 'number'],
                ['end', 'x', 'offset'],
            ]);
            expect(offsets.map((f) => f.value)).toEqual(row.shown);
            expect(groupAt(-50)).toBeCloseTo(row.reach[0], 10);
            expect(groupAt(50)).toBeCloseTo(row.reach[1], 10);
            expect(offsets[0].toProps('text')).toBeUndefined();

            expect(resolveCoordinate(offsets[0], 50, context)).toBe(50);
            expect(resolveCoordinate(offsets[0], -50, context)).toBe(-50);
            expect(resolveCoordinate(offsets[0], 50.01, context)).toBeUndefined();
            expect(resolveCoordinate(offsets[0], -51, context)).toBeUndefined();
        });

        it('is left out on number axes and where points snap to the band centre', () => {
            const datum = { ...lineDatum.create(), start: { x: 'Pears', y: 2 }, end: { x: 'Apples', y: 4 } };
            const numbers = createAxesContext(numberScale([0, 100]), numberScale([0, 50]));
            expect(getCoordinateFields(datum, numbers).some((f) => f.kind === 'offset')).toBe(false);

            const base = createAxesContext(categories(0), numberScale([0, 50]));
            const snapping = { ...base, xAxis: { ...base.xAxis, snapToGroup: true } };
            expect(getCoordinateFields(datum, snapping).some((f) => f.kind === 'offset')).toBe(false);
        });
    });

    describe('decimals of a number', () => {
        const datum = { ...lineDatum.create(), start: { x: 1, y: 4366.2765 }, end: { x: 2, y: 20 } };
        const twoDecimals = (value: unknown) => Number(value).toFixed(2);

        it.each<[string, AxisOverrides, number, number | undefined]>([
            ['the tick size ahead of the default label', { valueTickSize: () => 0.5 }, 1, 0.5],
            ['none for a whole tick size', { valueTickSize: () => 5 }, 0, 5],
            [
                'a format given to the crosshair label ahead of the tick size',
                { valueTickSize: () => 0.25, formatWithCrosshairLabel: () => '$4,366.277' },
                3,
                0.25,
            ],
            [
                'a format given to the crosshair label that hides a step of the tick size, which the spinner leaves',
                { valueTickSize: () => 0.01, formatWithCrosshairLabel: () => '4366' },
                0,
                undefined,
            ],
            [
                'a format given to the crosshair label, with the data left unread for a tick size',
                {
                    valueTickSize: (infer) => (infer === false ? undefined : 0.25),
                    formatWithCrosshairLabel: () => '$4,366.277',
                },
                3,
                undefined,
            ],
            [
                'the tick size where the crosshair label is not a plain number',
                { valueTickSize: () => 0.25, formatWithCrosshairLabel: () => 'Q3 2024' },
                2,
                0.25,
            ],
            ['the default label without a tick size', {}, 2, undefined],
            [
                'the default label for a time interval, which is not a number',
                { valueTickSize: () => 'day' as const },
                2,
                undefined,
            ],
        ])('follow %s, as does the spinner step', (_name, y, fractionDigits, step) => {
            const parallel = { ...parallelChannelDatum.create(), start: datum.start, end: datum.end, height: 12.3456 };
            const context = createAxesContext(numberScale([0, 100]), numberScale([0, 5000]), twoDecimals, { y });

            const fields = getCoordinateFields(parallel, context).filter((f) => f.axis === 'y');

            expect(fields.map((f) => f.row)).toEqual(['start', 'end', 'height']);
            expect(fields.map((f) => [f.fractionDigits, f.step])).toEqual(Array(3).fill([fractionDigits, step]));
        });
        const digitsOf = (format: (value: unknown) => string) =>
            getCoordinateFields(datum, createAxesContext(numberScale([0, 100]), numberScale([0, 5000]), format))
                .filter((f) => f.axis === 'y')
                .map((f) => f.fractionDigits);

        it('follow a plain number in the crosshair label, and only round the text shown', () => {
            expect(digitsOf((value) => Number(value).toFixed(2))).toEqual([2, 2]);
            expect(digitsOf((value) => `US$ ${Number(value).toLocaleString('en-US')}`)).toEqual([3, 0]);
            expect(digitsOf(() => '1,234.5')).toEqual([1, 1]);

            // Not a plain number, or not saying which separator is the decimal.
            for (const text of ['Q3 2024', '1.5e+3', '12,5', '1.234,5']) {
                expect(digitsOf(() => text)).toEqual([undefined, undefined]);
            }

            expect(displayCoordinate('4366.2765', 2)).toBe('4366.28');
            expect(displayCoordinate('4366.2765', undefined)).toBe('4366.2765');
            expect(displayCoordinate('20', 2)).toBe('20');
            expect(displayCoordinate('9007199254740993', 2)).toBe('9007199254740993');
        });
    });

    describe('category axis', () => {
        const scale = new CategoryScale<string | number>();
        scale.domain = ['Apples', 'Pears', 7];
        const context = createAxesContext(scale, numberScale([0, 50]));
        const datum = {
            ...lineDatum.create(),
            start: { x: { value: 'Pears', groupPercentage: 0.25 }, y: 2 },
            end: { x: 'Apples', y: 4 },
        };

        it('suggests the categories and resolves typed text to the one it names, keeping the group percentage', () => {
            const startX = getCoordinateFields(datum, context)[0];

            expect(startX.kind).toBe('category');
            expect(startX.value).toBe('Pears');
            expect(startX.suggestions?.()).toEqual(['Apples', 'Pears', '7']);
            expect(parseCoordinate('', 'category')).toBeUndefined();
            expect(resolveCoordinate(startX, 'Bananas', context)).toBeUndefined();
            expect(resolveCoordinate(startX, '2025', context)).toBeUndefined();

            const resolved = resolveCoordinate(startX, '7', context);

            expect(resolved).toBe(7);
            expect(startX.toProps(resolved!)).toEqual({ start: { x: { value: 7, groupPercentage: 0.25 } } });
        });

        it('shows and matches a category with a line break as the text input holds it', () => {
            const wrappedScale = new CategoryScale<string>();
            wrappedScale.domain = ['Sales\nExecutive', 'Manager'];
            const wrappedContext = createAxesContext(wrappedScale, numberScale([0, 50]));
            const wrappedDatum = { ...datum, start: { x: 'Sales\nExecutive', y: 2 } };
            const wrappedStartX = getCoordinateFields(wrappedDatum, wrappedContext)[0];

            expect(wrappedStartX.value).toBe('SalesExecutive');
            expect(wrappedStartX.suggestions?.()).toEqual(['SalesExecutive', 'Manager']);
            expect(resolveCoordinate(wrappedStartX, 'SalesExecutive', wrappedContext)).toBe('Sales\nExecutive');
        });
    });

    describe('unit time axis', () => {
        const scale = new UnitTimeScale();
        scale.domain = [new Date(2024, 0, 2, 15), new Date(2024, 0, 4, 9)];
        scale.interval = 'day';

        it('floors a date to the band holding it, including one beyond the first or last band', () => {
            expect(floorToBand(new Date(2024, 0, 3, 23, 59), scale)).toEqual(new Date(2024, 0, 3));
            expect(floorToBand(new Date(2024, 0, 2, 1), scale)).toEqual(new Date(2024, 0, 2));
            expect(floorToBand(new Date(2024, 0, 4, 23, 59), scale)).toEqual(new Date(2024, 0, 4));
            expect(floorToBand(new Date(2024, 0, 1, 23, 59), scale)).toEqual(new Date(2024, 0, 1));
            expect(floorToBand(new Date(2024, 0, 5, 7), scale)).toEqual(new Date(2024, 0, 5));
        });

        it('keeps the group percentage of the point being edited', () => {
            const context = createAxesContext(scale, numberScale([0, 50]));
            const datum = {
                ...lineDatum.create(),
                start: { x: { value: new Date(2024, 0, 2), groupPercentage: 0.5 }, y: 2 },
                end: { x: { value: new Date(2024, 0, 4), groupPercentage: 0 }, y: 4 },
            };
            const startX = getCoordinateFields(datum, context)[0];

            expect(startX.kind).toBe('unit-time');
            expect(startX.value).toBe('2024-01-02T00:00:00');

            const resolved = resolveCoordinate(startX, new Date(2024, 0, 3, 18), context);

            expect(resolved).toEqual(new Date(2024, 0, 3));
            expect(startX.toProps(resolved!)).toEqual({
                start: { x: { value: new Date(2024, 0, 3), groupPercentage: 0.5 } },
            });
        });
    });

    describe('ordinal time axis', () => {
        const bars = [new Date(2024, 0, 1), new Date(2024, 0, 2), new Date(2024, 0, 4)];

        it('snaps a date to the nearest bar, including one beyond the first or last bar, and has none to snap to without bars', () => {
            expect(snapToBar(new Date(2024, 0, 2, 11), bars)).toEqual(bars[1]);
            expect(snapToBar(new Date(2024, 0, 2, 23), bars)).toEqual(bars[1]);
            expect(snapToBar(new Date(2024, 0, 3, 6), bars)).toEqual(bars[2]);
            expect(snapToBar(new Date(2024, 0, 1), bars)).toEqual(bars[0]);
            expect(snapToBar(new Date(2023, 11, 31), bars)).toEqual(bars[0]);
            expect(snapToBar(new Date(2024, 0, 4, 1), bars)).toEqual(bars[2]);
            expect(snapToBar(new Date(2024, 0, 2), [])).toBeUndefined();
        });

        it('snaps the typed date, keeps the group percentage of the point being edited and rejects a number', () => {
            const ordinal = new OrdinalTimeScale();
            ordinal.domain = bars;
            const context = createAxesContext(ordinal, numberScale([0, 50]));
            const datum = {
                ...lineDatum.create(),
                start: { x: { value: bars[0], groupPercentage: 0.5 }, y: 2 },
                end: { x: { value: bars[2], groupPercentage: 0 }, y: 4 },
            };
            const startX = getCoordinateFields(datum, context)[0];

            expect(startX.kind).toBe('ordinal-time');
            expect(startX.value).toBe('2024-01-01T00:00:00');
            expect(resolveCoordinate(startX, 5, context)).toBeUndefined();

            const resolved = resolveCoordinate(startX, new Date(2024, 0, 2, 5), context);

            expect(resolved).toEqual(bars[1]);
            expect(startX.toProps(resolved!)).toEqual({ start: { x: { value: bars[1], groupPercentage: 0.5 } } });
        });
    });
});
