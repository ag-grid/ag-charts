import { describe, expect, test } from 'vitest';

import { navPageNames, navSectionsToIndex } from './docsNavIndex';
import type { DocsNavItem } from './docsRelatedLinks';

const SITE_ROOT = 'https://www.ag-grid.com/';

const NAV: DocsNavItem[] = [
    {
        title: 'Getting started',
        children: [
            { title: 'Quick Start', path: 'quick-start' },
            {
                title: 'Setup',
                children: [
                    { title: 'Installation', path: 'installation' },
                    { title: 'React Only', path: 'react-setup', frameworks: ['react'] },
                ],
            },
            { title: 'Reference Only' },
        ],
    },
    {
        title: 'Themes',
        children: [{ title: 'GitHub', url: 'https://github.com/ag-grid/ag-charts' }],
    },
];

describe('navSectionsToIndex', () => {
    const index = navSectionsToIndex({ sections: NAV, framework: 'javascript', siteRoot: SITE_ROOT });

    test('emits one group per nav group, named by its full path, in nav order', () => {
        expect(index.map(({ title }) => title)).toEqual(['Getting started', 'Getting started > Setup', 'Themes']);
    });

    test('resolves docs pages to absolute URLs for the given framework', () => {
        expect(index[0].links).toEqual([
            { title: 'Quick Start', url: 'https://www.ag-grid.com/javascript/quick-start/' },
        ]);
        expect(index[1].links).toEqual([
            { title: 'Installation', url: 'https://www.ag-grid.com/javascript/installation/' },
        ]);
    });

    test('drops pages the framework does not have, and headings that point nowhere', () => {
        const titles = index.flatMap(({ links }) => links.map((link) => link.title));

        expect(titles).not.toContain('React Only');
        expect(titles).not.toContain('Reference Only');
        expect(navSectionsToIndex({ sections: NAV, framework: 'react', siteRoot: SITE_ROOT })[1].links).toHaveLength(2);
    });

    test('passes whole `url` items through unchanged', () => {
        expect(index[2].links).toEqual([{ title: 'GitHub', url: 'https://github.com/ag-grid/ag-charts' }]);
    });

    test('drops an untitled nav level from the heading, as a hideTitle section has none', () => {
        const untitled: DocsNavItem[] = [{ children: [{ title: 'AG Charts: Reference', path: 'reference' }] }];

        expect(
            navSectionsToIndex({ sections: untitled, framework: 'javascript', titlePrefix: 'Reference' })[0].title
        ).toBe('Reference');
    });

    test('prefixes the group names when the nav needs naming from outside', () => {
        const prefixed = navSectionsToIndex({
            sections: NAV,
            framework: 'javascript',
            siteRoot: SITE_ROOT,
            titlePrefix: 'Reference',
        });

        expect(prefixed.map(({ title }) => title)).toEqual([
            'Reference > Getting started',
            'Reference > Getting started > Setup',
            'Reference > Themes',
        ]);
    });
});

describe('navPageNames', () => {
    test('collects every page the nav reaches, at any depth', () => {
        expect(navPageNames(NAV)).toEqual(new Set(['quick-start', 'installation', 'react-setup']));
    });

    test('includes childPaths, which are pages the nav owns without listing separately', () => {
        const withChildPaths: DocsNavItem[] = [
            { title: 'Themes', path: 'themes', childPaths: ['themes-api', 'themes-overrides'] },
        ];

        expect(navPageNames(withChildPaths)).toEqual(new Set(['themes', 'themes-api', 'themes-overrides']));
    });
});
