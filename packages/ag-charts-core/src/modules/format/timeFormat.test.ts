import { describe, expect, it } from '@jest/globals';

import { buildDateFormatter } from './timeFormat';

describe('Date/Time Formatting', () => {
    const DEFAULT_DATE = new Date(Date.UTC(2019, 8, 3, 14, 50, 17, 300));
    // Falls on a Tuesday.
    const FIRST_DAY_OF_2019 = new Date(Date.UTC(2019, 0, 1, 13, 51, 16, 200));
    // Falls on a Monday.
    const FIRST_DAY_OF_2018 = new Date(Date.UTC(2018, 0, 1, 11, 12, 13, 100));
    // Falls on a Sunday.
    const FIRST_DAY_OF_2017 = new Date(Date.UTC(2017, 0, 1, 11, 12, 13, 100));

    type Case = { name: string; format: string; expected: { 'en-US': string }; date?: Date };
    const cases: Case[] = [
        {
            name: 'short text',
            format: '%a %-d %b, %y',
            expected: { 'en-US': 'Tue 3 Sep, 19' },
        },
        {
            name: 'long text',
            format: '%A %d %B, %Y',
            expected: { 'en-US': 'Tuesday 03 September, 2019' },
        },
        {
            name: 'locale date + time',
            format: '%c',
            expected: { 'en-US': '9/3/2019, 3:50:17 PM' },
        },
        {
            name: 'precise time',
            format: '%H:%M:%S.%L',
            expected: { 'en-US': '15:50:17.300' },
        },
        {
            name: 'super-precise time',
            format: '%H:%M:%S.%f',
            expected: { 'en-US': '15:50:17.300000' },
        },
        {
            name: 'am/pm',
            format: '%I:%M %p',
            expected: { 'en-US': '03:50 PM' },
        },
        {
            name: 'UNIX milliseconds',
            format: '%Q',
            expected: { 'en-US': '1567522217300' },
        },
        {
            name: 'UNIX seconds',
            format: '%s',
            expected: { 'en-US': '1567522217' },
        },
        {
            name: 'days of year',
            format: '%j',
            expected: { 'en-US': '246' },
        },
        {
            name: 'days of year (1st day)',
            format: '%j',
            expected: { 'en-US': '001' },
            date: FIRST_DAY_OF_2019,
        },
        {
            name: 'weeks of year (Sunday-based)',
            format: '%U',
            expected: { 'en-US': '35' },
        },
        {
            name: 'weeks of year (Sunday-based) 1st Jan 2019',
            format: '%U',
            expected: { 'en-US': '00' },
            date: FIRST_DAY_OF_2019,
        },
        {
            name: 'weeks of year (Sunday-based) 1st Jan 2018',
            format: '%U',
            expected: { 'en-US': '00' },
            date: FIRST_DAY_OF_2018,
        },
        {
            name: 'weeks of year (Sunday-based) 1st Jan 2017',
            format: '%U',
            expected: { 'en-US': '01' },
            date: FIRST_DAY_OF_2017,
        },
        {
            name: 'weeks of year (Monday-based)',
            format: '%W',
            expected: { 'en-US': '35' },
        },
        {
            name: 'weeks of year (Monday-based) 1st Jan 2019',
            format: '%W',
            expected: { 'en-US': '00' },
            date: FIRST_DAY_OF_2019,
        },
        {
            name: 'weeks of year (Monday-based) 1st Jan 2018',
            format: '%W',
            expected: { 'en-US': '01' },
            date: FIRST_DAY_OF_2018,
        },
        {
            name: 'weeks of year (Monday-based) 1st Jan 2017',
            format: '%W',
            expected: { 'en-US': '00' },
            date: FIRST_DAY_OF_2017,
        },
        {
            name: 'weeks of year (ISO-based)',
            format: '%V',
            expected: { 'en-US': '36' },
        },
        {
            name: 'weeks of year (ISO-based) 1st Jan 2019',
            format: '%V',
            expected: { 'en-US': '01' },
            date: FIRST_DAY_OF_2019,
        },
        {
            name: 'weeks of year (ISO-based) 1st Jan 2018',
            format: '%V',
            expected: { 'en-US': '01' },
            date: FIRST_DAY_OF_2018,
        },
        {
            name: 'weeks of year (ISO-based) 1st Jan 2017',
            format: '%V',
            expected: { 'en-US': '52' },
            date: FIRST_DAY_OF_2017,
        },
        {
            name: 'timezone offset',
            format: '%Z',
            expected: { 'en-US': '+0100' },
        },
        {
            name: 'locale date',
            format: '%x',
            expected: { 'en-US': '9/3/2019' },
        },
        {
            name: 'locale time',
            format: '%X',
            expected: { 'en-US': '3:50:17 PM' },
        },
        {
            name: '% escape',
            format: '100%%',
            expected: { 'en-US': '100%' },
        },
        {
            name: 'default padding',
            format: '%A, %d %B, %Y - %H:%M:%S.%L',
            expected: { 'en-US': 'Tuesday, 03 September, 2019 - 15:50:17.300' },
        },
        {
            name: '0 padding',
            format: '%A, %0d %B, %Y - %H:%M:%S.%L',
            expected: { 'en-US': 'Tuesday, 03 September, 2019 - 15:50:17.300' },
        },
        {
            name: 'space padding',
            format: '%A, %_d %B, %Y - %H:%M:%S.%L',
            expected: { 'en-US': 'Tuesday,  3 September, 2019 - 15:50:17.300' },
        },
        {
            name: 'null padding',
            format: '%A, %-d %B, %Y - %H:%M:%S.%L',
            expected: { 'en-US': 'Tuesday, 3 September, 2019 - 15:50:17.300' },
        },
        {
            name: 'invalid formatters',
            format: '%T%n',
            expected: { 'en-US': 'Tn' },
        },
    ];
    const langs = [['en-US']] as const;

    it('should be using Europe/London timezone', () => {
        // If this test fails, check that process.env.TZ is set to Europe/London in jest.setup.js.
        expect(DEFAULT_DATE.getTimezoneOffset()).toEqual(-60);
    });

    describe('buildDateFormatter', () => {
        describe.each(langs)('%s', (lang) => {
            it.each(cases)('$name', (row) => {
                const { format, expected, date = DEFAULT_DATE } = row;
                const formatter = buildDateFormatter(lang, format);
                expect(formatter(date)).toStrictEqual(expected[lang]);
            });
        });
    });
});
