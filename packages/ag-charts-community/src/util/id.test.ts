import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { createId, resetIds } from './id';

class TestLineSeries {
    static className = 'TestLineSeries';
}

class TestBarSeries {
    static className = 'TestBarSeries';
}

describe('id util', () => {
    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    describe('createId', () => {
        beforeEach(() => {
            resetIds();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
            expect(console.error).not.toBeCalled();
        });

        test('reset', () => {
            const lineInstance = new TestLineSeries();
            const barInstance = new TestBarSeries();

            expect(createId(lineInstance)).toEqual('TestLineSeries-1');
            expect(createId(lineInstance)).toEqual('TestLineSeries-2');
            expect(createId(lineInstance)).toEqual('TestLineSeries-3');
            expect(createId(barInstance)).toEqual('TestBarSeries-1');
            expect(createId(barInstance)).toEqual('TestBarSeries-2');
            expect(createId(barInstance)).toEqual('TestBarSeries-3');

            resetIds();

            expect(createId(lineInstance)).toEqual('TestLineSeries-1');
            expect(createId(lineInstance)).toEqual('TestLineSeries-2');
            expect(createId(lineInstance)).toEqual('TestLineSeries-3');
            expect(createId(barInstance)).toEqual('TestBarSeries-1');
            expect(createId(barInstance)).toEqual('TestBarSeries-2');
            expect(createId(barInstance)).toEqual('TestBarSeries-3');
        });

        test('reservedIds', () => {
            const instance = new TestLineSeries();
            const reservedIds = [...Array(100).keys()].map((i) => `TestLineSeries-${i + 1}`);
            expect(createId(instance, reservedIds)).toEqual('TestLineSeries-101');
            expect(createId(instance, reservedIds)).toEqual('TestLineSeries-102');
            expect(createId(instance, reservedIds)).toEqual('TestLineSeries-103');
        });
    });
});
