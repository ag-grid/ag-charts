import { getFrameworkVersionLinks } from './frameworkVersionLinks';

describe('getFrameworkVersionLinks', () => {
    test('links the same page in the other three frameworks', () => {
        expect(getFrameworkVersionLinks({ path: '/react/line-series/', currentFramework: 'react' })).toEqual([
            { framework: 'angular', label: 'Angular Charts', href: '/angular/line-series/' },
            { framework: 'vue', label: 'Vue Charts', href: '/vue/line-series/' },
            { framework: 'javascript', label: 'JavaScript Charts', href: '/javascript/line-series/' },
        ]);
    });

    test('does not link the current framework', () => {
        const links = getFrameworkVersionLinks({ path: '/vue/line-series/', currentFramework: 'vue' });

        expect(links.map((l) => l.framework)).toEqual(['react', 'angular', 'javascript']);
    });
});
