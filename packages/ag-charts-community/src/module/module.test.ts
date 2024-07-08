import { describe, expect, it } from '@jest/globals';

import { BaseModuleInstance, Module, ModuleRegistry } from './module';

describe('Module', () => {
    let moduleRegistry: ModuleRegistry;

    beforeEach(() => {
        moduleRegistry = new ModuleRegistry();
    });

    describe('byType', () => {
        const one: Module = {
            type: 'root',
            optionsKey: 'one',
            packageType: 'community',
            chartTypes: ['cartesian'],
            instanceConstructor: class extends BaseModuleInstance {},
        };

        const two: Module = {
            type: 'axis-option',
            optionsKey: 'two',
            packageType: 'community',
            chartTypes: ['cartesian'],
            axisTypes: ['category'],
            themeTemplate: {},
            instanceConstructor: class extends BaseModuleInstance {},
        };

        const three: Module = {
            type: 'root',
            optionsKey: 'three',
            packageType: 'community',
            chartTypes: ['cartesian'],
            instanceConstructor: class extends BaseModuleInstance {},
        };

        it('should load the root modules', () => {
            moduleRegistry.register(one, two, three);

            const order = [];
            for (const module of moduleRegistry.byType('root')) {
                order.push(module.optionsKey);
            }

            expect(order).toEqual(['one', 'three']);
        });

        it('should load the axis-option modules', () => {
            moduleRegistry.register(one, two, three);

            const order = [];
            for (const module of moduleRegistry.byType('axis-option')) {
                order.push(module.optionsKey);
            }

            expect(order).toEqual(['two']);
        });
    });

    describe('dependencies', () => {
        const one: Module = {
            type: 'root',
            optionsKey: 'one',
            dependencies: ['two'],
            packageType: 'community',
            chartTypes: ['cartesian'],
            instanceConstructor: class extends BaseModuleInstance {},
        };

        const two: Module = {
            type: 'root',
            optionsKey: 'two',
            dependencies: ['three'],
            packageType: 'community',
            chartTypes: ['cartesian'],
            instanceConstructor: class extends BaseModuleInstance {},
        };

        it('should load the modules in dependency order', () => {
            const three: Module = {
                type: 'root',
                optionsKey: 'three',
                packageType: 'community',
                chartTypes: ['cartesian'],
                instanceConstructor: class extends BaseModuleInstance {},
            };

            moduleRegistry.register(one, two, three);

            const order = [];
            for (const module of moduleRegistry.byType('root')) {
                order.push(module.optionsKey);
            }

            expect(order).toEqual(['three', 'two', 'one']);
        });

        it('should fail on circular dependencies', () => {
            const three: Module = {
                type: 'root',
                optionsKey: 'three',
                dependencies: ['one'],
                packageType: 'community',
                chartTypes: ['cartesian'],
                instanceConstructor: class extends BaseModuleInstance {},
            };

            moduleRegistry.register(one, two, three);

            expect(() => moduleRegistry.byType('root').next()).toThrowErrorMatchingInlineSnapshot(
                `"Could not resolve module dependencies: [one,two,three]"`
            );
        });

        it('should fail on missing dependencies', () => {
            moduleRegistry.register(two);

            expect(() => moduleRegistry.byType('root').next()).toThrowErrorMatchingInlineSnapshot(
                `"Could not resolve module dependencies: [two]"`
            );
        });
    });
});
