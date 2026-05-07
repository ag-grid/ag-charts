import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
    type AxisModuleDefinition,
    type ChartModuleDefinition,
    ModuleType,
    type PresetModuleDefinition,
    type SeriesModuleDefinition,
} from './moduleDefinition';
import {
    RegistryMode,
    getAxisModule,
    getChartModule,
    getPresetModule,
    getSeriesModule,
    hasModule,
    ifRegistryChanged,
    isEnterprise,
    isIntegrated,
    isModuleType,
    isUmd,
    listModules,
    listModulesByType,
    register,
    registerModules,
    reset,
    setRegistryMode,
} from './moduleRegistry';

const everyModuleDefaults = {
    enterprise: false,
    version: '1.0.0',
    create: () => ({}),
} as const;

const createChartModule = (
    name: string,
    overrides: Partial<ChartModuleDefinition<any>> = {}
): ChartModuleDefinition<any> => ({
    type: ModuleType.Chart,
    name,
    options: {},
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
    options: {},
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
    options: {},
    ...everyModuleDefaults,
    ...overrides,
});

const createPresetModule = (
    name: string,
    overrides: Partial<PresetModuleDefinition<any>> = {}
): PresetModuleDefinition<any> => ({
    type: ModuleType.Preset,
    name,
    options: {},
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

            register(module);

            expect(hasModule('series-module')).toBe(true);
            expect(getSeriesModule('series-module')).toBe(module);
            expect(Array.from(listModules())).toEqual([module]);
        });

        test('allows enterprise modules to replace community modules when versions match', () => {
            const community = createSeriesModule('replacement-target');
            const enterprise = createSeriesModule('replacement-target', { enterprise: true });

            register(community);
            register(enterprise);

            expect(getSeriesModule('replacement-target')).toBe(enterprise);
        });

        test('ignores duplicate registrations with the same version', () => {
            const first = createSeriesModule('duplicate-module');
            const second = createSeriesModule('duplicate-module', { chartType: 'polar' });

            register(first);
            register(second);

            expect(getSeriesModule('duplicate-module')).toBe(first);
        });

        test('throws when the same module is registered with a different version', () => {
            const first = createSeriesModule('conflicting-module');
            const conflicting = createSeriesModule('conflicting-module', { chartType: 'polar', version: '2.0.0' });

            register(first);

            expect(() => register(conflicting)).toThrow(/already registered with different version/);
        });
    });

    describe('registerModules', () => {
        test('registers each provided module definition', () => {
            const axis = createAxisModule('axis-module');
            const series = createSeriesModule('series-module');

            registerModules([axis, series]);

            expect(getAxisModule('axis-module')).toBe(axis);
            expect(getSeriesModule('series-module')).toBe(series);
        });
    });

    describe('reset', () => {
        test('clears the registry', () => {
            register(createSeriesModule('temporary-module'));

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

            register(series);
            register(axis);
            register(chart);

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

            registerModules([axis, chart, preset, series]);

            expect(getAxisModule('axis-module')).toBe(axis);
            expect(getAxisModule('series-module')).toBeUndefined();

            expect(getChartModule('chart-module')).toBe(chart);
            expect(() => getChartModule('axis-module')).toThrowErrorMatchingInlineSnapshot(
                `[Error: AG Charts - Unknown chart type; Check options are correctly structured and series types are specified]`
            );

            expect(getPresetModule('preset-module')).toBe(preset);
            expect(getPresetModule('series-module')).toBeUndefined();

            expect(getSeriesModule('series-module')).toBe(series);
            expect(getSeriesModule('preset-module')).toBeUndefined();
        });
    });

    describe('registry modes', () => {
        test('isEnterprise() is false by default', () => {
            expect(isEnterprise()).toBe(false);
        });

        test('setRegistryMode toggles enterprise mode', () => {
            setRegistryMode(RegistryMode.Enterprise);

            expect(isEnterprise()).toBe(true);
        });

        test('setRegistryMode toggles integrated mode', () => {
            setRegistryMode(RegistryMode.Integrated);

            expect(isIntegrated()).toBe(true);
        });

        test('setRegistryMode toggles UMD mode', () => {
            setRegistryMode(RegistryMode.UMD);

            expect(isUmd()).toBe(true);
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

    describe('ifRegistryChanged', () => {
        test('runs the callback the first time and returns the current revision', () => {
            const callback = vi.fn();
            const revision = ifRegistryChanged(-1, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(typeof revision).toBe('number');
        });

        test('skips the callback when the revision is unchanged', () => {
            const initialRevision = ifRegistryChanged(-1, () => {});

            const callback = vi.fn();
            const revision = ifRegistryChanged(initialRevision, callback);

            expect(callback).not.toHaveBeenCalled();
            expect(revision).toBe(initialRevision);
        });

        test('invalidates after a module is registered', () => {
            const initialRevision = ifRegistryChanged(-1, () => {});

            register(createSeriesModule('after-cache-module'));

            const callback = vi.fn();
            const newRevision = ifRegistryChanged(initialRevision, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(newRevision).not.toBe(initialRevision);
        });

        test('invalidates after reset()', () => {
            register(createSeriesModule('module-before-reset'));
            const revisionBeforeReset = ifRegistryChanged(-1, () => {});

            reset();

            const callback = vi.fn();
            const revisionAfterReset = ifRegistryChanged(revisionBeforeReset, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(revisionAfterReset).not.toBe(revisionBeforeReset);
        });
    });
});
