import { describe, expect, it } from '@jest/globals';

import * as locales from './main';

const { AG_CHARTS_LOCALE_EN_US } = locales;
const enKeys = Object.keys(AG_CHARTS_LOCALE_EN_US).sort((a, b) => a.localeCompare(b));
const formatters = ['number', 'percent', 'date', 'time', 'datetime'];
const formatterRegExp = /\[([^\]]*)\]/g;
const variableRegExp = /(\$\{\w+\})/g;

// Ignored since the translations are currently a moving target.
describe.skip('translations', () => {
    describe.each(Object.keys(locales))('%s', (locale) => {
        const translations = (locales as any)[locale] as Record<string, string>;

        it('has all translations defined', () => {
            expect(Object.keys(translations).sort((a, b) => a.localeCompare(b))).toEqual(enKeys);
        });

        describe.each(Object.keys(translations))('%s', (key) => {
            const translation = translations[key];

            it('has correct formatters', () => {
                const formats = Array.from(translation.matchAll(formatterRegExp), (match) => match[1]);

                expect(formatters).toEqual(expect.arrayContaining(formats));
            });

            it('has the same variables as en-US', () => {
                const variables = Array.from(translation.matchAll(variableRegExp), (match) => match[1]).sort((a, b) =>
                    a.localeCompare(b)
                );
                const enVariables = Array.from(
                    AG_CHARTS_LOCALE_EN_US[key].matchAll(variableRegExp),
                    (match) => match[1]
                ).sort((a, b) => a.localeCompare(b));

                expect(variables).toEqual(enVariables);
            });
        });
    });
});
