import { beforeEach, describe, expect, test } from '@jest/globals';

import {
    type AxisModuleDefinition,
    type ChartModuleDefinition,
    ModuleType,
    type PresetModuleDefinition,
    type SeriesModuleDefinition,
} from '../interfaces/moduleDefinition';
import {
    getAxisModule,
    getChartModule,
    getPresetModule,
    getSeriesModule,
    hasEnterpriseModules,
    hasModule,
    isModuleType,
    listModules,
    listModulesByType,
    register,
    registerMany,
    reset,
} from './moduleRegistry';

const everyModuleDefaults = {
    enterprise: false,
    create: () => ({}),
} as const;

const createChartModule = (
    name: string,
    overrides: Partial<ChartModuleDefinition<any>> = {}
): ChartModuleDefinition<any> => ({
    type: ModuleType.Chart,
    name,
    options: {} as any,
    ...everyModuleDefaults,
    ...overrides,
});

const createAxisModule = (
    name: string,
    overrides: Partial<AxisModuleDefinition<any>> = {}
): AxisModuleDefinition<any> => ({
    type: ModuleType.Axis,
    name,
    chartType: 'cartesian',
    options: {} as any,
    ...everyModuleDefaults,
    ...overrides,
});

const createSeriesModule = (
    name: string,
    overrides: Partial<SeriesModuleDefinition<any>> = {}
): SeriesModuleDefinition<any> => ({
    type: ModuleType.Series,
    name,
    chartType: 'cartesian',
    options: {} as any,
    ...everyModuleDefaults,
    ...overrides,
});

const createPresetModule = (
    name: string,
    overrides: Partial<PresetModuleDefinition<any>> = {}
): PresetModuleDefinition<any> => ({
    type: ModuleType.Preset,
    name,
    options: {} as any,
    ...everyModuleDefaults,
    ...overrides,
});

describe('moduleRegistry', () => {
    beforeEach(() => {
        reset();
    });

    describe('register', () => {
        test('stores new module definitions', () => {
            const module = createSeriesModule('series-module');

            register(module, '1.0.0');

            expect(hasModule('series-module')).toBe(true);
            expect(getSeriesModule('series-module')).toBe(module);
            expect(Array.from(listModules())).toEqual([module]);
        });

        test('allows enterprise modules to replace community modules when versions match', () => {
            const community = createSeriesModule('replacement-target');
            const enterprise = createSeriesModule('replacement-target', { enterprise: true });

            register(community, '1.0.0');
            register(enterprise, '1.0.0');

            expect(getSeriesModule('replacement-target')).toBe(enterprise);
        });

        test('ignores duplicate registrations with the same version', () => {
            const first = createSeriesModule('duplicate-module');
            const second = createSeriesModule('duplicate-module', { chartType: 'polar' });

            register(first, '1.0.0');
            register(second, '1.0.0');

            expect(getSeriesModule('duplicate-module')).toBe(first);
        });

        test('throws when the same module is registered with a different version', () => {
            const first = createSeriesModule('conflicting-module');
            const conflicting = createSeriesModule('conflicting-module', { chartType: 'polar' });

            register(first, '1.0.0');

            expect(() => register(conflicting, '2.0.0')).toThrow(/already registered with different version/);
        });
    });

    describe('registerMany', () => {
        test('registers each provided module definition', () => {
            const axis = createAxisModule('axis-module');
            const series = createSeriesModule('series-module');

            registerMany([axis, series], '1.0.0');

            expect(getAxisModule('axis-module')).toBe(axis);
            expect(getSeriesModule('series-module')).toBe(series);
        });
    });

    describe('reset', () => {
        test('clears the registry', () => {
            register(createSeriesModule('temporary-module'), '1.0.0');

            reset();

            expect(hasModule('temporary-module')).toBe(false);
            expect(Array.from(listModules())).toHaveLength(0);
        });
    });

    describe('listing functions', () => {
        test('listModulesByType yields only modules of the requested type', () => {
            const series = createSeriesModule('series-module');
            const axis = createAxisModule('axis-module');
            const chart = createChartModule('chart-module');

            register(series, '1.0.0');
            register(axis, '1.0.0');
            register(chart, '1.0.0');

            expect(Array.from(listModulesByType(ModuleType.Series))).toEqual([series]);
            expect(Array.from(listModulesByType(ModuleType.Axis))).toEqual([axis]);
        });
    });

    describe('getters', () => {
        test('return a module only when the stored type matches', () => {
            const axis = createAxisModule('axis-module');
            const chart = createChartModule('chart-module');
            const preset = createPresetModule('preset-module');
            const series = createSeriesModule('series-module');

            registerMany([axis, chart, preset, series], '1.0.0');

            expect(getAxisModule('axis-module')).toBe(axis);
            expect(getAxisModule('series-module')).toBeUndefined();

            expect(getChartModule('chart-module')).toBe(chart);
            expect(() => getChartModule('axis-module')).toThrowErrorMatchingInlineSnapshot(
                `"AG Charts - Unknown chart type; Check options are correctly structured and series types are specified"`
            );

            expect(getPresetModule('preset-module')).toBe(preset);
            expect(getPresetModule('series-module')).toBeUndefined();

            expect(getSeriesModule('series-module')).toBe(series);
            expect(getSeriesModule('preset-module')).toBeUndefined();
        });
    });

    describe('hasEnterpriseModules', () => {
        test('detects when any registered module is flagged as enterprise', () => {
            register(createSeriesModule('community-module'), '1.0.0');

            expect(hasEnterpriseModules()).toBe(false);

            register(createSeriesModule('enterprise-module', { enterprise: true }), '1.0.0');

            expect(hasEnterpriseModules()).toBe(true);
        });
    });

    describe('isModuleType', () => {
        test('narrows module definitions by module type', () => {
            const series = createSeriesModule('series-module');
            const axis = createAxisModule('axis-module');

            expect(isModuleType(ModuleType.Series, series)).toBe(true);
            expect(isModuleType(ModuleType.Series, axis)).toBe(false);
            expect(isModuleType(ModuleType.Series, undefined)).toBe(false);
        });
    });
});
