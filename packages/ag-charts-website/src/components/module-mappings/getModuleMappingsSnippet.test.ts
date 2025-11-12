import { getModuleMappingsSnippet } from './getModuleMappingsSnippet';

describe('getModuleMappingsSnippet', () => {
    test('returns undefined when no modules are selected', () => {
        expect(getModuleMappingsSnippet({ selectedModules: { community: [], enterprise: [] } })).toBeUndefined();
    });

    test('formats community modules', () => {
        const snippet = getModuleMappingsSnippet({
            selectedModules: {
                community: ['LineSeriesModule'],
                enterprise: [],
            },
        });

        expect(snippet).toMatchInlineSnapshot(`
          "import {\n              ModuleRegistry,\n              LineSeriesModule,\n          } from 'ag-charts-community';\n\n          ModuleRegistry.registerModules([\n              LineSeriesModule,\n          ]);"
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

    test('spreads bundle helpers', () => {
        const snippet = getModuleMappingsSnippet({
            selectedModules: {
                community: ['AllCommunityModule'],
                enterprise: ['AllEnterpriseModules'],
            },
        });

        expect(snippet).toMatchInlineSnapshot(`
          "import {\n              ModuleRegistry,\n              AllCommunityModule,\n          } from 'ag-charts-community';\n          import {\n              AllEnterpriseModules,\n          } from 'ag-charts-enterprise';\n\n          ModuleRegistry.registerModules([\n              ...AllCommunityModule,\n              ...AllEnterpriseModules,\n          ]);"
        `);
    });

    test('supports all-in-one bundle', () => {
        const snippet = getModuleMappingsSnippet({
            selectedModules: {
                community: [],
                enterprise: ['AllCommunityAndEnterpriseModules'],
            },
        });

        expect(snippet).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
              AllCommunityAndEnterpriseModules,
          } from 'ag-charts-enterprise';

          ModuleRegistry.registerModules(AllCommunityAndEnterpriseModules);"
        `);
    });
});
