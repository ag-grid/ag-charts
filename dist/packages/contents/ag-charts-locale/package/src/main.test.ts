import { describe, expect, it } from '@jest/globals';

import * as locales from './main';

const { AG_CHARTS_LOCALE_EN_US } = locales;
const enKeys = Object.keys(AG_CHARTS_LOCALE_EN_US).sort();
const formatters = ['number', 'percent', 'date', 'time', 'datetime'];
const formatterRegExp = /\[([^\]]*)\]/g;
const variableRegExp = /(\$\{\w+\})/g;

// TODO: re-enable once all translations are added (https://ag-grid.atlassian.net/browse/AG-11957)
describe('translations', () => {
    describe.each(Object.keys(locales))('%s', (locale) => {
        const translations = (locales as any)[locale] as Record<string, string>;

        it('has all translations defined', () => {
            expect(Object.keys(translations).sort()).toEqual(enKeys);
        });

        describe.each(Object.keys(translations))('%s', (key) => {
            const translation = translations[key];

            it('has correct formatters', () => {
                const formats = Array.from(translation.matchAll(formatterRegExp), (match) => match[1]);

                expect(formatters).toEqual(expect.arrayContaining(formats));
            });

            it('has the same variables as en-US', () => {
                const variables = Array.from(translation.matchAll(variableRegExp), (match) => match[1]).sort();
                const enVariables = Array.from(
                    AG_CHARTS_LOCALE_EN_US[key].matchAll(variableRegExp),
                    (match) => match[1]
                ).sort();

                expect(variables).toEqual(enVariables);
            });
        });
    });
});
