import { describe, expect, it } from 'vitest';

import apiMenu from '../../src/content/api-menu/menu.json';
import docsNav from '../../src/content/docs-nav/nav.json';
import { API_PAGE_RANK_BASE, DOCS_RANK_BASE, RANK_STEP, getIndexPages } from './indexPages';

const convertToFrameworkUrl = (url: string, framework: string) => `/${framework}/${url}/`;

const realPages = getIndexPages({ docsNav, apiMenu });
const docsPages = realPages.filter((page) => !page.isApiPage);
const apiPages = realPages.filter((page) => page.isApiPage);

/** Every `path` in the real docs nav that the indexer should walk, in nav order. */
function navPaths(): string[] {
    const paths: string[] = [];
    const walk = (items: any[] | undefined) => {
        for (const item of items ?? []) {
            if (item.path && !item.hidden) {
                paths.push(item.path);
            }
            walk(item.children);
        }
    };
    for (const topLevelItems of Object.values(docsNav)) {
        walk(topLevelItems as any[]);
    }
    return paths;
}

describe('getIndexPages — API tab pages (AG-18532)', () => {
    it('indexes the six framework API pages, in menu order, after every docs page', () => {
        expect(apiPages.map(({ path, breadcrumb }) => ({ path, breadcrumb }))).toEqual([
            { path: 'api-create-update', breadcrumb: 'API > Chart API' },
            { path: 'events', breadcrumb: 'API > Events API' },
            { path: 'api-download', breadcrumb: 'API > Download API' },
            { path: 'api-state', breadcrumb: 'API > State API' },
            { path: 'context', breadcrumb: 'API > Context API' },
            { path: 'ts-generics', breadcrumb: 'API > TypeScript Generics' },
        ]);

        // The API pages are appended after the docs pages, so a docs page never follows one.
        expect(realPages.slice(docsPages.length)).toEqual(apiPages);
    });

    it('leaves the pure reference pages unsearchable', () => {
        // `/options` and `/themes-api` are explicitly out of scope — their contents must not be indexed.
        expect(realPages.map((page) => page.path)).not.toContain('options');
        expect(realPages.map((page) => page.path)).not.toContain('themes-api');
        expect(realPages.map((page) => page.breadcrumb)).not.toContain('API > Options API');
        expect(realPages.map((page) => page.breadcrumb)).not.toContain('API > Themes API');
    });

    it('normalises API paths to a bare page name the framework URL builder can use', () => {
        for (const { path } of apiPages) {
            expect(path).not.toContain('[framework]');
            expect(path).not.toContain('/');
        }

        expect(convertToFrameworkUrl(apiPages[1].path, 'react')).toBe('/react/events/');
        expect(convertToFrameworkUrl(apiPages[1].path, 'javascript')).toBe('/javascript/events/');
    });

    it('ranks every API page below every docs page', () => {
        const lowestDocsRank = Math.min(...docsPages.map((page) => page.rank));

        expect(apiPages[0].rank).toBeLessThan(lowestDocsRank);
        expect(apiPages[0].rank).toBe(API_PAGE_RANK_BASE);
        expect(apiPages.map((page) => page.rank)).toEqual(
            apiPages.map((_, index) => API_PAGE_RANK_BASE - index * RANK_STEP)
        );
    });

    it('does not collide with a docs breadcrumb', () => {
        // The search UI keys off a leading `API` breadcrumb, and `distinct` is on `breadcrumb`.
        expect(docsPages.filter((page) => page.breadcrumb.startsWith('API >'))).toEqual([]);
        expect(new Set(realPages.map((page) => page.breadcrumb)).size).toBe(realPages.length);
    });
});

describe('getIndexPages — docs nav walk is unchanged', () => {
    it('walks exactly the nav paths, in nav order', () => {
        expect(docsPages.map((page) => page.path)).toEqual(navPaths());
        expect(docsPages[0]).toMatchObject({ path: 'quick-start', breadcrumb: 'Getting started > Quick Start' });
        // A page nested inside a group, to pin the multi-level breadcrumb against the real nav.
        expect(docsPages.find((page) => page.path === 'installation')).toMatchObject({
            breadcrumb: 'Getting started > Setup > Installation',
        });
    });

    it('ranks docs pages from 10000, decrementing per indexed page only', () => {
        expect(docsPages.map((page) => page.rank)).toEqual(
            docsPages.map((_, index) => DOCS_RANK_BASE - index * RANK_STEP)
        );
    });

    it('builds nested breadcrumbs from groups that have no page of their own', () => {
        const pages = getIndexPages({
            docsNav: {
                sections: [
                    {
                        title: 'Section',
                        children: [
                            { title: 'Group', children: [{ title: 'Leaf', path: 'leaf' }] },
                            { title: 'Hidden', path: 'hidden-page', hidden: true },
                            { title: 'Next', path: 'next' },
                        ],
                    },
                ],
            },
            apiMenu: { items: [] },
        });

        expect(pages).toEqual([
            { path: 'leaf', breadcrumb: 'Section > Group > Leaf', rank: DOCS_RANK_BASE, isApiPage: false },
            { path: 'next', breadcrumb: 'Section > Next', rank: DOCS_RANK_BASE - RANK_STEP, isApiPage: false },
        ]);
    });
});
