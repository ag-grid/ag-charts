import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type {
    AgBaseChartOptions,
    AgChartInstance,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgQuadrantChartOptions,
    AgSparklineOptions,
    AgVolumeProfileChartOptions,
} from 'ag-charts-types';

import { setupEnterpriseModules } from '../setup';
import { PRESET_FACTORIES, type PresetName } from './test/presetFactories';

setupEnterpriseModules();

const OPTION_VALUES = {
    background: { fill: 'red' },
    border: { enabled: true, stroke: 'red', strokeWidth: 4 },
    contextMenu: { enabled: true },
    keyboard: { tabIndex: 3 },
    loadGoogleFonts: true,
    locale: { localeText: { ariaLabelChart: 'Localised chart' } },
    touch: { dragAction: 'hover' },
    validations: { consoleOn: ['error', 'warning'] },
} as const;

type OptionName = keyof typeof OPTION_VALUES;

const BASE_OPTIONS: OptionName[] = ['border', 'keyboard', 'loadGoogleFonts', 'validations'];

const PRESET_OPTIONS: Record<PresetName, OptionName[]> = {
    'linear gauge': BASE_OPTIONS,
    'radial gauge': BASE_OPTIONS,
    quadrant: [...BASE_OPTIONS, 'touch', 'background', 'contextMenu'],
    'price-volume': [...BASE_OPTIONS, 'touch', 'locale'],
    'volume-profile': [...BASE_OPTIONS, 'touch', 'locale'],
};

const CASES = Object.entries(PRESET_OPTIONS).flatMap(([preset, options]) =>
    options.map((option) => [preset as PresetName, option] as const)
);

// Never when every chart option is either supported by the preset or listed as excluded, and no excluded option is supported.
type UncoveredChartOptions<TPreset, TExcluded extends keyof AgBaseChartOptions> =
    Exclude<keyof AgBaseChartOptions, keyof TPreset | TExcluded> | Extract<TExcluded, keyof TPreset>;

type ExcludedFromAllPresets =
    'flashOnUpdate' | 'gradientLegend' | 'legend' | 'loading' | 'overlays' | 'ranges' | 'scrollbar' | 'seriesArea';

type ExcludedFromGauge =
    | ExcludedFromAllPresets
    | 'data'
    | 'dataIdKey'
    | 'dataSource'
    | 'enableRtl'
    | 'formatter'
    | 'initialState'
    | 'navigator'
    | 'suppressFieldDotNotation'
    | 'sync'
    | 'touch'
    | 'zoom';

type ExcludedFromQuadrant = ExcludedFromAllPresets | 'dataSource' | 'navigator' | 'sync' | 'zoom';

type ExcludedFromFinancial =
    | ExcludedFromAllPresets
    | 'animation'
    | 'background'
    | 'context'
    | 'contextMenu'
    | 'footnote'
    | 'highlight'
    | 'padding'
    | 'selection'
    | 'subtitle'
    | 'tooltip';

type ExcludedFromVolumeProfile = Exclude<ExcludedFromFinancial, 'selection'> | 'navigator' | 'sync' | 'zoom';

type ExcludedFromSparkline =
    | ExcludedFromAllPresets
    | 'animation'
    | 'border'
    | 'contextMenu'
    | 'dataIdKey'
    | 'dataSource'
    | 'enableRtl'
    | 'footnote'
    | 'formatter'
    | 'initialState'
    | 'keyboard'
    | 'loadGoogleFonts'
    | 'navigator'
    | 'subtitle'
    | 'sync'
    | 'title'
    | 'touch'
    | 'validations'
    | 'zoom';

describe('preset chart options', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance<any> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each(CASES)('the %s preset forwards %s to the chart', async (preset, option) => {
        const value = OPTION_VALUES[option];
        chart = PRESET_FACTORIES[preset]({
            container: document.createElement('div'),
            width: 400,
            height: 300,
            [option]: value,
        });
        await waitForChartStability(chart);

        const { processedOptions } = deproxy(chart).chartOptions;
        expect(processedOptions).toMatchObject({ [option]: value });
        expect(processedOptions.series?.every((series) => !(option in series))).toBe(true);
    });

    it('every preset supports or explicitly excludes each chart option', () => {
        expectTypeOf<UncoveredChartOptions<AgGaugeOptions, ExcludedFromGauge>>().toEqualTypeOf<never>();
        expectTypeOf<UncoveredChartOptions<AgQuadrantChartOptions, ExcludedFromQuadrant>>().toEqualTypeOf<never>();
        expectTypeOf<UncoveredChartOptions<AgFinancialChartOptions, ExcludedFromFinancial>>().toEqualTypeOf<never>();
        expectTypeOf<
            UncoveredChartOptions<AgVolumeProfileChartOptions, ExcludedFromVolumeProfile>
        >().toEqualTypeOf<never>();
        expectTypeOf<UncoveredChartOptions<AgSparklineOptions, ExcludedFromSparkline>>().toEqualTypeOf<never>();
    });
});
