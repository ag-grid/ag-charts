import { describe, expect, it } from 'vitest';

import {
    BandScale,
    CategoryScale,
    GroupedCategoryScale,
    LinearScale,
    OrdinalTimeScale,
    TimeScale,
    UnitTimeScale,
} from 'ag-charts-core';

import { horizontalLineDatum, verticalLineDatum } from '../cross-line/crossLineDatum';
import { disjointChannelDatum } from '../disjoint-channel/disjointChannelDatum';
import { fibonacciRetracementTrendBasedDatum } from '../fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import { lineDatum } from '../line/lineDatum';
import { parallelChannelDatum } from '../parallel-channel/parallelChannelDatum';
import { createAxesContext } from '../test/fixture';
import {
    floorToBand,
    formatCoordinate,
    getCoordinateFields,
    getCoordinateKind,
    parseCoordinate,
    resolveCoordinate,
    snapToBar,
} from './coordinates';

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
        it.each([
            ['linear', numberScale([0, 10]), 'number'],
            ['time', timeScale([new Date(2024, 0, 1), new Date(2024, 0, 31)]), 'time'],
            ['ordinal time', new OrdinalTimeScale(), 'ordinal-time'],
            ['unit time', new UnitTimeScale(), 'unit-time'],
        ])('reads a %s scale as %s', (_name, scale, expected) => {
            expect(getCoordinateKind({ scale: scale as any })).toBe(expected);
        });

        it('reads a category scale as category but leaves other band scales uneditable', () => {
            expect(getCoordinateKind({ scale: new CategoryScale() })).toBe('category');
            expect(getCoordinateKind({ scale: new GroupedCategoryScale() })).toBeUndefined();
            expect(getCoordinateKind({ scale: Object.create(BandScale.prototype) })).toBeUndefined();
        });
    });

    describe('formatCoordinate and parseCoordinate', () => {
        it('round-trips a number', () => {
            expect(formatCoordinate(12.5, 'number')).toBe('12.5');
            expect(parseCoordinate('12.5', 'number')).toBe(12.5);
        });

        it('round-trips a date as a local date-time', () => {
            expect(formatCoordinate(DAY, 'time')).toBe('2024-01-05T09:30:00');
            expect(parseCoordinate('2024-01-05T09:30:00', 'time')).toEqual(DAY);
        });

        it('keeps the seconds and shows milliseconds only when present', () => {
            const withSeconds = new Date(2024, 0, 5, 9, 30, 15);
            const withMilliseconds = new Date(2024, 0, 5, 9, 30, 15, 70);

            expect(formatCoordinate(withSeconds, 'time')).toBe('2024-01-05T09:30:15');
            expect(parseCoordinate('2024-01-05T09:30:15', 'time')).toEqual(withSeconds);
            expect(formatCoordinate(withMilliseconds, 'time')).toBe('2024-01-05T09:30:15.070');
            expect(parseCoordinate('2024-01-05T09:30:15.070', 'time')).toEqual(withMilliseconds);
        });

        it('formats the value of a grouped point', () => {
            expect(formatCoordinate({ value: 3, groupPercentage: 0.5 }, 'number')).toBe('3');
        });

        it('formats a missing value as empty', () => {
            expect(formatCoordinate(undefined, 'number')).toBe('');
            expect(formatCoordinate(undefined, 'time')).toBe('');
        });

        it.each([
            ['', 'number'],
            ['  ', 'number'],
            ['abc', 'number'],
            ['Infinity', 'number'],
            ['', 'time'],
            ['not a date', 'time'],
        ] as const)('rejects %j as a %s', (text, kind) => {
            expect(parseCoordinate(text, kind)).toBeUndefined();
        });
    });

    describe('getCoordinateFields', () => {
        const context = createAxesContext(numberScale([0, 100]), numberScale([0, 50]));

        it('lists the start and end of a line on number axes', () => {
            const datum = { ...lineDatum.create(), start: { x: 1, y: 2 }, end: { x: 3, y: 4 } };

            const fields = getCoordinateFields(datum, context);

            expect(fields.map((f) => [f.row, f.axis, f.value])).toEqual([
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

            expect(fields.map((f) => [f.row, f.axis, f.value])).toEqual([
                ['start', 'x', '1'],
                ['start', 'y', '2'],
                ['end', 'x', '3'],
                ['end', 'y', '4'],
                ['endRetracement', 'x', '5'],
                ['endRetracement', 'y', '6'],
            ]);
            expect(fields[5].toProps(9)).toEqual({ endRetracement: { y: 9 } });
        });

        it('omits the x fields on an axis that is not editable', () => {
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

        it('types the x fields of a time axis as time', () => {
            const datum = { ...lineDatum.create(), start: { x: DAY, y: 2 }, end: { x: DAY, y: 4 } };

            const fields = getCoordinateFields(
                datum,
                createAxesContext(timeScale([new Date(2024, 0, 1), new Date(2024, 0, 31)]), numberScale([0, 50]))
            );

            expect(fields.filter((f) => f.axis === 'x').map((f) => [f.kind, f.value])).toEqual([
                ['time', '2024-01-05T09:30:00'],
                ['time', '2024-01-05T09:30:00'],
            ]);
        });

        it('steps a time input by the second, or the millisecond when the value has them', () => {
            const datum = {
                ...lineDatum.create(),
                start: { x: new Date(2024, 0, 5, 9, 30, 15, 70), y: 2 },
                end: { x: DAY, y: 4 },
            };

            const fields = getCoordinateFields(datum, createAxesContext(timeScale([DAY, DAY]), numberScale([0, 50])));

            expect(fields.filter((f) => f.axis === 'x').map((f) => f.step)).toEqual([0.001, 1]);
            expect(fields.filter((f) => f.axis === 'y').map((f) => f.step)).toEqual([undefined, undefined]);
        });

        it('lists the single value of a cross line on its own axis', () => {
            const horizontal = { ...horizontalLineDatum.create(), value: 20 };
            const vertical = { ...verticalLineDatum.create(), value: 30 };

            expect(getCoordinateFields(horizontal, context).map((f) => [f.row, f.axis, f.value])).toEqual([
                ['value', 'y', '20'],
            ]);
            expect(getCoordinateFields(vertical, context).map((f) => [f.row, f.axis, f.value])).toEqual([
                ['value', 'x', '30'],
            ]);
            expect(getCoordinateFields(horizontal, context)[0].toProps(5)).toEqual({ value: 5 });
        });

        it('adds the height of a parallel channel as its offset', () => {
            const datum = { ...parallelChannelDatum.create(), height: 12 };

            const offset = getCoordinateFields(datum, context).filter((f) => f.row === 'offset');

            expect(offset.map((f) => f.value)).toEqual(['12']);
            expect(offset[0].toProps(8)).toEqual({ height: 8 });
        });

        it('adds both heights of a disjoint channel as its offsets', () => {
            const datum = { ...disjointChannelDatum.create(), startHeight: 3, endHeight: 6 };

            const fields = getCoordinateFields(datum, context).filter((f) => f.row.endsWith('Offset'));

            expect(fields.map((f) => [f.row, f.value])).toEqual([
                ['startOffset', '3'],
                ['endOffset', '6'],
            ]);
            expect(fields[1].toProps(1)).toEqual({ endHeight: 1 });
        });

        it('has no offset when the y axis is not numeric', () => {
            const datum = { ...parallelChannelDatum.create(), height: 12 };
            const timeY = timeScale([new Date(2024, 0, 1), new Date(2024, 0, 31)]);

            const fields = getCoordinateFields(datum, createAxesContext(numberScale([0, 100]), timeY));

            expect(fields.some((f) => f.row === 'offset')).toBe(false);
        });
    });

    describe('resolveCoordinate', () => {
        const context = createAxesContext(numberScale([0, 100]), numberScale([0, 50]));
        const datum = { ...lineDatum.create(), start: { x: 1, y: 2 }, end: { x: 3, y: 4 } };
        const [startX, startY] = getCoordinateFields(datum, context);

        it('accepts a value inside the axis domain', () => {
            expect(resolveCoordinate(startX, 100, context)).toBe(100);
            expect(resolveCoordinate(startY, 0, context)).toBe(0);
        });

        it('rejects a value outside the domain of its own axis', () => {
            expect(resolveCoordinate(startX, 101, context)).toBeUndefined();
            expect(resolveCoordinate(startY, 51, context)).toBeUndefined();
            expect(resolveCoordinate(startY, -1, context)).toBeUndefined();
        });

        it('does not bind an offset to the domain', () => {
            const channel = { ...parallelChannelDatum.create(), height: 1 };
            const offset = getCoordinateFields(channel, context).find((f) => f.row === 'offset')!;

            expect(resolveCoordinate(offset, 500, context)).toBe(500);
        });
    });

    describe('category axis', () => {
        const categories = ['Apples', 'Pears', 7];
        const scale = new CategoryScale<string | number>();
        scale.domain = categories;
        const context = createAxesContext(scale, numberScale([0, 50]));
        const datum = {
            ...lineDatum.create(),
            start: { x: { value: 'Pears', groupPercentage: 0.25 }, y: 2 },
            end: { x: 'Apples', y: 4 },
        };
        const startX = getCoordinateFields(datum, context)[0];

        it('suggests the categories and shows the current one', () => {
            expect(startX.kind).toBe('category');
            expect(startX.value).toBe('Pears');
            expect(startX.suggestions).toEqual(['Apples', 'Pears', '7']);
        });

        it('resolves typed text to the category it names and keeps the group percentage', () => {
            expect(parseCoordinate('Apples', 'category')).toBe('Apples');
            expect(parseCoordinate('', 'category')).toBeUndefined();

            const resolved = resolveCoordinate(startX, '7', context);

            expect(resolved).toBe(7);
            expect(startX.toProps(resolved!)).toEqual({ start: { x: { value: 7, groupPercentage: 0.25 } } });
        });

        it('rejects text that names no category', () => {
            expect(resolveCoordinate(startX, 'apples', context)).toBeUndefined();
        });

        it('shows and matches a category with a line break as the text input holds it', () => {
            const wrappedScale = new CategoryScale<string>();
            wrappedScale.domain = ['Sales\nExecutive', 'Manager'];
            const wrappedContext = createAxesContext(wrappedScale, numberScale([0, 50]));
            const wrappedDatum = { ...datum, start: { x: 'Sales\nExecutive', y: 2 } };
            const wrappedStartX = getCoordinateFields(wrappedDatum, wrappedContext)[0];

            expect(wrappedStartX.value).toBe('SalesExecutive');
            expect(wrappedStartX.suggestions).toEqual(['SalesExecutive', 'Manager']);
            expect(resolveCoordinate(wrappedStartX, 'SalesExecutive', wrappedContext)).toBe('Sales\nExecutive');
        });
    });

    describe('unit time axis', () => {
        const scale = new UnitTimeScale();
        scale.domain = [new Date(2024, 0, 2, 15), new Date(2024, 0, 4, 9)];
        scale.interval = 'day';
        const context = createAxesContext(scale, numberScale([0, 50]));
        const datum = {
            ...lineDatum.create(),
            start: { x: { value: new Date(2024, 0, 2), groupPercentage: 0.5 }, y: 2 },
            end: { x: { value: new Date(2024, 0, 4), groupPercentage: 0 }, y: 4 },
        };
        const startX = getCoordinateFields(datum, context)[0];

        it('floors a date to the band holding it', () => {
            expect(startX.kind).toBe('unit-time');
            expect(startX.value).toBe('2024-01-02T00:00:00');
            expect(floorToBand(new Date(2024, 0, 3, 23, 59), scale)).toEqual(new Date(2024, 0, 3));
            expect(floorToBand(new Date(2024, 0, 2, 1), scale)).toEqual(new Date(2024, 0, 2));
        });

        it('rejects a date before the first band or after the last', () => {
            expect(floorToBand(new Date(2024, 0, 1, 23, 59), scale)).toBeUndefined();
            expect(floorToBand(new Date(2024, 0, 4, 23, 59), scale)).toEqual(new Date(2024, 0, 4));
            expect(floorToBand(new Date(2024, 0, 5), scale)).toBeUndefined();
        });

        it('keeps the group percentage of the point being edited', () => {
            const resolved = resolveCoordinate(startX, new Date(2024, 0, 3, 18), context);

            expect(resolved).toEqual(new Date(2024, 0, 3));
            expect(startX.toProps(resolved!)).toEqual({
                start: { x: { value: new Date(2024, 0, 3), groupPercentage: 0.5 } },
            });
        });
    });

    describe('ordinal time axis', () => {
        const bars = [new Date(2024, 0, 1), new Date(2024, 0, 2), new Date(2024, 0, 4)];
        const ordinal = new OrdinalTimeScale();
        ordinal.domain = bars;
        const context = createAxesContext(ordinal, numberScale([0, 50]));

        it('snaps a date to the nearest bar and rejects one beyond the first or last bar', () => {
            expect(snapToBar(new Date(2024, 0, 2, 11), bars)).toEqual(bars[1]);
            expect(snapToBar(new Date(2024, 0, 2, 23), bars)).toEqual(bars[1]);
            expect(snapToBar(new Date(2024, 0, 3, 6), bars)).toEqual(bars[2]);
            expect(snapToBar(new Date(2024, 0, 1), bars)).toEqual(bars[0]);
            expect(snapToBar(new Date(2023, 11, 31), bars)).toBeUndefined();
            expect(snapToBar(new Date(2024, 0, 4, 1), bars)).toBeUndefined();
        });

        it('snaps the typed date and keeps the group percentage of the point being edited', () => {
            const datum = {
                ...lineDatum.create(),
                start: { x: { value: bars[0], groupPercentage: 0.5 }, y: 2 },
                end: { x: { value: bars[2], groupPercentage: 0 }, y: 4 },
            };
            const startX = getCoordinateFields(datum, context)[0];

            expect(startX.kind).toBe('ordinal-time');
            expect(startX.value).toBe('2024-01-01T00:00:00');

            const resolved = resolveCoordinate(startX, new Date(2024, 0, 2, 5), context);

            expect(resolved).toEqual(bars[1]);
            expect(startX.toProps(resolved!)).toEqual({ start: { x: { value: bars[1], groupPercentage: 0.5 } } });
        });

        it('rejects a number for a date field', () => {
            const datum = { ...lineDatum.create(), start: { x: bars[0], y: 2 }, end: { x: bars[2], y: 4 } };
            const startX = getCoordinateFields(datum, context)[0];

            expect(resolveCoordinate(startX, 5, context)).toBeUndefined();
        });
    });
});
