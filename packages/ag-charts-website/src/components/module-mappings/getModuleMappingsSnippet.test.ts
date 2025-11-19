import { getModuleMappingsSnippet } from './getModuleMappingsSnippet';

describe('getModuleMappingsSnippet', () => {
    test('returns placeholder snippet when no modules are selected', () => {
        const snippet = getModuleMappingsSnippet({ selectedModules: { community: [], enterprise: [] } });

        expect(snippet).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
          } from 'ag-charts-community';

          ModuleRegistry.registerModules([
              // no modules selected
          ]);"
        `);
    });

    test('formats community modules', () => {
        const snippet = getModuleMappingsSnippet({
            selectedModules: {
                community: ['LineSeriesModule'],
                enterprise: [],
            },
        });

        expect(snippet).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
              LineSeriesModule,
          } from 'ag-charts-community';

          ModuleRegistry.registerModules([
              LineSeriesModule,
          ]);"
        `);
    });

    test('formats enterprise modules', () => {
        const snippet = getModuleMappingsSnippet({
            selectedModules: {
                community: [],
                enterprise: ['HeatmapSeriesModule', 'AnnotationsModule'],
            },
        });

        expect(snippet).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
              HeatmapSeriesModule,
              AnnotationsModule,
          } from 'ag-charts-enterprise';

          ModuleRegistry.registerModules([
              HeatmapSeriesModule,
              AnnotationsModule,
          ]);"
        `);
    });

    test('registers bundle helpers without spreading', () => {
        const snippet = getModuleMappingsSnippet({
            selectedModules: {
                community: ['AllCommunityModule'],
                enterprise: ['AllEnterpriseModules'],
            },
        });

        expect(snippet).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
              AllCommunityModule,
          } from 'ag-charts-community';
          import {
              AllEnterpriseModules,
          } from 'ag-charts-enterprise';

          ModuleRegistry.registerModules([
              AllCommunityModule,
              AllEnterpriseModules,
          ]);"
        `);
    });

    test('supports all-in-one bundle', () => {
        const snippet = getModuleMappingsSnippet({
            selectedModules: {
                community: [],
                enterprise: ['AllEnterpriseModule'],
            },
        });

        expect(snippet).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
              AllEnterpriseModule,
          } from 'ag-charts-enterprise';

          ModuleRegistry.registerModules([
              AllEnterpriseModule,
          ]);"
        `);
    });
});
