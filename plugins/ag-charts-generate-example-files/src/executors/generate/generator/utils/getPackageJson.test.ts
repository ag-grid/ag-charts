import { getPackageJson } from './getPackageJson';

vi.mock('fs', async (importOriginal) => ({
    ...(await importOriginal<typeof import('fs')>()),
    readFileSync: () => JSON.stringify({ version: '1.2.3' }),
}));

const dependenciesOf = (internalFramework: Parameters<typeof getPackageJson>[0]['internalFramework']) =>
    getPackageJson({ isEnterprise: false, internalFramework }).dependencies as Record<string, string>;

describe('getPackageJson', () => {
    // The generated TypeScript imports `clone`, and strict type-checking needs its declarations.
    test.each(['angular', 'reactFunctionalTs', 'vue3'] as const)('%s ships the declarations of clone', (framework) => {
        const dependencies = dependenciesOf(framework);
        expect(dependencies['clone']).toBeDefined();
        expect(dependencies['@types/clone']).toBeDefined();
    });

    test('the JavaScript React variant has no types to ship', () => {
        const dependencies = dependenciesOf('reactFunctional');
        expect(dependencies['clone']).toBeDefined();
        expect(dependencies['@types/clone']).toBeUndefined();
    });

    test('the vanilla variants do not depend on clone', () => {
        for (const framework of ['vanilla', 'typescript'] as const) {
            expect(dependenciesOf(framework)['clone']).toBeUndefined();
            expect(dependenciesOf(framework)['@types/clone']).toBeUndefined();
        }
    });
});
