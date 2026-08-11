import { type ExampleFramework, getImportMap } from './getImportMap';

const FRAMEWORKS: ExampleFramework[] = ['typescript', 'react', 'angular', 'vue3'];

const WRAPPERS: Record<ExampleFramework, string | undefined> = {
    typescript: undefined,
    react: 'ag-charts-react',
    angular: 'ag-charts-angular',
    vue3: 'ag-charts-vue3',
};

describe('getImportMap', () => {
    describe.each(FRAMEWORKS)('%s', (framework) => {
        const importMap = getImportMap({ framework });

        test('resolves the library packages', () => {
            expect(importMap['ag-charts-community']).toMatch(/\.mjs$/);
            expect(importMap['ag-charts-enterprise']).toMatch(/\.mjs$/);
            expect(importMap['ag-charts-locale']).toMatch(/\.mjs$/);
        });

        test('resolves this framework wrapper and no other', () => {
            const wrapper = WRAPPERS[framework];
            const resolvedWrappers = Object.values(WRAPPERS).filter(
                (candidate) => candidate !== undefined && importMap[candidate] !== undefined
            );

            expect(resolvedWrappers).toEqual(wrapper ? [wrapper] : []);
            if (wrapper) {
                expect(importMap[wrapper]).toMatch(/\.mjs$/);
            }
        });
    });

    test('only gives a framework the third-party modules it needs', () => {
        expect(getImportMap({ framework: 'react' }).react).toBeDefined();
        expect(getImportMap({ framework: 'vue3' }).vue).toBeDefined();
        expect(getImportMap({ framework: 'angular' })['@angular/core']).toBeDefined();

        const typescript = getImportMap({ framework: 'typescript' });
        expect(typescript.react).toBeUndefined();
        expect(typescript.vue).toBeUndefined();
        expect(typescript['@angular/core']).toBeUndefined();
    });

    test('resolves clone for the frameworks whose generated code imports it', () => {
        // Every generator but the plain TypeScript one injects `import clone from 'clone'`
        for (const framework of ['react', 'angular', 'vue3'] as ExampleFramework[]) {
            expect(getImportMap({ framework }).clone, framework).toBeDefined();
        }

        expect(getImportMap({ framework: 'typescript' }).clone).toBeUndefined();
    });

    test('is sorted, so the emitted import map is stable across builds', () => {
        const keys = Object.keys(getImportMap({ framework: 'angular' }));

        expect(keys).toEqual([...keys].sort());
    });
});
