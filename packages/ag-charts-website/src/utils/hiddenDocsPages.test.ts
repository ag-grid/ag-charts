import { fileURLToPath } from 'node:url';

import { getHiddenDocsPageNames, isHiddenFrontmatter } from './hiddenDocsPages';

describe('isHiddenFrontmatter', () => {
    test.each`
        contents                                          | expected
        ${"---\ntitle: 'A'\nhidden: true\n---\n\nBody"}   | ${true}
        ${"---\r\ntitle: 'A'\r\nhidden: true\r\n---\r\n"} | ${true}
        ${"---\ntitle: 'A'\nhidden: false\n---\n"}        | ${false}
        ${"---\ntitle: 'A'\n---\n\nhidden: true"}         | ${false}
        ${"---\ntitle: 'A'\nhideSideMenu: true\n---\n"}   | ${false}
        ${'No frontmatter\nhidden: true'}                 | ${false}
    `('$contents -> $expected', ({ contents, expected }) => {
        expect(isHiddenFrontmatter(contents)).toBe(expected);
    });
});

describe('getHiddenDocsPageNames', () => {
    const docsDir = fileURLToPath(new URL('../content/docs', import.meta.url));

    test('finds the hidden docs pages', () => {
        const names = getHiddenDocsPageNames(docsDir);

        expect(names).toEqual(expect.arrayContaining(['benchmarks', 'sparklines']));
        expect(names).not.toContain('bar-series');
    });
});
