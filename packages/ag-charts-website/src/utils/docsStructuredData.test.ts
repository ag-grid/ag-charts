import type { JsonLdObject } from '@ag-website-shared/utils/structuredData';

import { buildDocsPageStructuredData, getDocsPageUrl, getExampleSourceCodeProperties } from './docsStructuredData';

const CANONICAL_URL_BASE = 'https://www.ag-grid.com/charts';

const findNode = (nodes: JsonLdObject[], type: string) => nodes.find((node) => node['@type'] === type)!;

describe('buildDocsPageStructuredData', () => {
    test('emits the TechArticle, docs topic and BreadcrumbList for the page', () => {
        const nodes = buildDocsPageStructuredData({
            canonicalUrlBase: CANONICAL_URL_BASE,
            framework: 'react',
            pageName: 'axes-types',
            title: 'Axis Types',
            description: 'Choose an axis type.',
        });

        expect(nodes.map((node) => node['@type'])).toEqual(['TechArticle', 'CreativeWork', 'BreadcrumbList']);
    });

    test('names the framework in the article keywords and dependencies, and links it to the product', () => {
        const nodes = buildDocsPageStructuredData({
            canonicalUrlBase: CANONICAL_URL_BASE,
            framework: 'vue',
            pageName: 'axes-types',
            title: 'Axis Types',
            description: 'Choose an axis type.',
        });
        const article = findNode(nodes, 'TechArticle');

        expect(article.keywords).toEqual(['Vue', 'Vue Charts', 'AG Charts', 'Axis Types']);
        expect(article.dependencies).toBe('ag-charts-vue3');
        expect(article.about).toEqual({ '@id': `${CANONICAL_URL_BASE}/#software-application` });
    });

    test('adds ag-charts-enterprise to the dependencies of an enterprise page', () => {
        const nodes = buildDocsPageStructuredData({
            canonicalUrlBase: CANONICAL_URL_BASE,
            framework: 'javascript',
            pageName: 'heatmap-series',
            title: 'Heatmap Series',
            description: 'Plot a heatmap.',
            isEnterprise: true,
        });

        expect(findNode(nodes, 'TechArticle').dependencies).toBe('ag-charts-community, ag-charts-enterprise');
    });

    test('every framework variant of a page shares one topic that lists all of them', () => {
        const topicsByFramework = (['react', 'angular', 'vue', 'javascript'] as const).map((framework) => {
            const nodes = buildDocsPageStructuredData({
                canonicalUrlBase: CANONICAL_URL_BASE,
                framework,
                pageName: 'axes-types',
                title: 'Axis Types',
                description: 'Choose an axis type.',
            });
            const article = findNode(nodes, 'TechArticle');
            const topic = findNode(nodes, 'CreativeWork');
            expect(article.isPartOf).toContainEqual({ '@id': topic['@id'] });
            return topic;
        });

        for (const topic of topicsByFramework) {
            expect(topic).toEqual(topicsByFramework[0]);
        }
        expect(topicsByFramework[0].hasPart).toEqual([
            { '@id': `${CANONICAL_URL_BASE}/react/axes-types/#article` },
            { '@id': `${CANONICAL_URL_BASE}/angular/axes-types/#article` },
            { '@id': `${CANONICAL_URL_BASE}/vue/axes-types/#article` },
            { '@id': `${CANONICAL_URL_BASE}/javascript/axes-types/#article` },
        ]);
    });

    test('breadcrumbs go from the site root through the framework landing hub to the page', () => {
        const nodes = buildDocsPageStructuredData({
            canonicalUrlBase: CANONICAL_URL_BASE,
            framework: 'angular',
            pageName: 'axes-types',
            title: 'Axis Types',
            description: 'Choose an axis type.',
        });

        expect(findNode(nodes, 'BreadcrumbList').itemListElement).toEqual([
            { '@type': 'ListItem', position: 1, name: 'AG Charts', item: `${CANONICAL_URL_BASE}/` },
            { '@type': 'ListItem', position: 2, name: 'Angular Charts', item: `${CANONICAL_URL_BASE}/angular/` },
            {
                '@type': 'ListItem',
                position: 3,
                name: 'Axis Types',
                item: `${CANONICAL_URL_BASE}/angular/axes-types/`,
            },
        ]);
    });

    test('a framework without a landing hub uses its redirect target as the framework crumb', () => {
        const nodes = buildDocsPageStructuredData({
            canonicalUrlBase: CANONICAL_URL_BASE,
            framework: 'javascript',
            pageName: 'axes-types',
            title: 'Axis Types',
            description: 'Choose an axis type.',
        });

        expect((findNode(nodes, 'BreadcrumbList').itemListElement as JsonLdObject[])[1]).toEqual({
            '@type': 'ListItem',
            position: 2,
            name: 'JavaScript Charts',
            item: `${CANONICAL_URL_BASE}/javascript/quick-start/`,
        });
    });

    test('drops the framework crumb on the redirect target itself rather than repeating the page', () => {
        const nodes = buildDocsPageStructuredData({
            canonicalUrlBase: CANONICAL_URL_BASE,
            framework: 'javascript',
            pageName: 'quick-start',
            title: 'Quick Start',
            description: 'Get started.',
        });

        expect((findNode(nodes, 'BreadcrumbList').itemListElement as JsonLdObject[]).map((item) => item.item)).toEqual([
            `${CANONICAL_URL_BASE}/`,
            `${CANONICAL_URL_BASE}/javascript/quick-start/`,
        ]);
    });
});

describe('getDocsPageUrl', () => {
    test('builds the canonical framework docs URL under the charts base with a trailing slash', () => {
        expect(getDocsPageUrl({ canonicalUrlBase: CANONICAL_URL_BASE, framework: 'react', pageName: 'events' })).toBe(
            `${CANONICAL_URL_BASE}/react/events/`
        );
    });
});

describe('getExampleSourceCodeProperties', () => {
    test.each([
        ['typescript', 'TypeScript', 'JavaScript'],
        ['vanilla', 'JavaScript', 'JavaScript'],
        ['reactFunctionalTs', 'TypeScript', 'React'],
        ['reactFunctional', 'JavaScript', 'React'],
        ['angular', 'TypeScript', 'Angular'],
        ['vue3', 'TypeScript', 'Vue'],
    ] as const)('%s source is %s on %s', (internalFramework, programmingLanguage, runtimePlatform) => {
        expect(getExampleSourceCodeProperties(internalFramework)).toEqual({ programmingLanguage, runtimePlatform });
    });
});
