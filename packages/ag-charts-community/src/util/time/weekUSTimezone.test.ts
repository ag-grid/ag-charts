/**
 * @timezone US/Pacific
 */
import { expect, test } from '@jest/globals';

import { sunday } from './week';

it('should execute with Los Angeles timezone', () => {
    expect(new Date(2023, 0, 1).getTimezoneOffset()).toEqual(480);
});

test.each([
    // 7 == August
    new Date(2019, 7, 18, 15, 10, 5, 100),
    new Date(2019, 7, 19, 15, 10, 5, 100),
    new Date(2019, 7, 20, 15, 10, 5, 100),
    new Date(2019, 7, 21, 15, 10, 5, 100),
    new Date(2019, 7, 22, 15, 10, 5, 100),
    new Date(2019, 7, 23, 15, 10, 5, 100),
    new Date(2019, 7, 24, 15, 10, 5, 100),
])('sunday.get/floor for %s', (date) => {
    const sundayDate = sunday.floor(date);
    expect(sundayDate).toEqual(new Date(2019, 7, 18, 0, 0, 0, 0));
});

test('sunday.get/floor twice', () => {
    const date = new Date(2019, 7, 23, 15, 10, 5, 100); // 7 == August
    const sundayDate = sunday.floor(date);
    expect(sundayDate).toEqual(sunday.floor(sundayDate));
});

test('sunday.range', () => {
    const d0 = new Date(2019, 7, 23, 15, 10, 5, 100);
    const d1 = new Date(2019, 8, 27, 10, 12, 2, 700);

    const sundays = sunday.range(d0, d1);
    expect(sundays.length).toBe(5);
    expect(sundays[0]).toEqual(new Date(2019, 7, 25, 0, 0, 0, 0));
    expect(sundays[1]).toEqual(new Date(2019, 8, 1, 0, 0, 0, 0));
    expect(sundays[2]).toEqual(new Date(2019, 8, 8, 0, 0, 0, 0));
    expect(sundays[3]).toEqual(new Date(2019, 8, 15, 0, 0, 0, 0));
    expect(sundays[4]).toEqual(new Date(2019, 8, 22, 0, 0, 0, 0));
});
