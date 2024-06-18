import * as locales from './main';

describe('translations', () => {
    const enKeys = Object.keys(locales.AG_CHARTS_LOCALE_EN_US);

    it.each(Object.keys(locales))('locale %s has all translations defined', (locale) => {
        expect(Object.keys((locales as any)[locale])).toEqual(enKeys);
    });
});
