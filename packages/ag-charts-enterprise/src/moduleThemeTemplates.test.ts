import { describe, expect, it } from 'vitest';

import { AllCommunityModule } from 'ag-charts-community';
import { isPresetOverridesType, themeOptionsDefFor } from 'ag-charts-community-test';
import {
    Logger,
    type ModuleDefinition,
    ModuleScope,
    ModuleType,
    type OptionsContribution,
    contributionMatchesAxisType,
    contributionMatchesChartType,
    contributionMatchesSeriesType,
    describeValidator,
    nestAtOptionsPath,
    validate,
} from 'ag-charts-core';

import { AllEnterpriseModule } from './main';

type Placement = [label: string, overrides: object];

// Preset templates nest series options under `series`; user theme overrides put them at the entry root.
function seriesTemplateOverrides(name: string, template: object): object {
    if (!isPresetOverridesType(name)) return { [name]: template };
    const { series, ...root } = template as { series?: object };
    return { [name]: { ...root, ...series } };
}

// Chart-level templates merge into the theme of each series type of their chart type; preset overrides
// take preset options rather than chart options, so they have no place for them.
function* chartTemplatePlacements(
    scope: ModuleScope,
    label: string,
    template: object,
    applies: (chartType: string) => boolean
): Generator<Placement> {
    for (const { name, chartType } of scope.listModulesByType(ModuleType.Series)) {
        if (applies(chartType) && !isPresetOverridesType(name)) yield [`${label}[${name}]`, { [name]: template }];
    }
}

function* moduleTemplatePlacements(scope: ModuleScope): Generator<Placement> {
    for (const definition of scope.listModules()) {
        const template = definition.themeTemplate;
        if (template == null) continue;
        const label = `${definition.type}:${definition.name}`;
        if (definition.type === 'series') {
            yield [label, seriesTemplateOverrides(definition.name, template)];
        } else if (definition.type === 'chart') {
            yield* chartTemplatePlacements(scope, label, template, (chartType) => chartType === definition.name);
        } else if (definition.type === 'axis') {
            yield [label, { common: { axes: { [definition.name]: template } } }];
        }
    }
}

type ContributionValue = (definition: ModuleDefinition, contribution: OptionsContribution) => unknown;

function* contributionTemplatePlacements(
    scope: ModuleScope,
    valueOf: ContributionValue = (_, contribution) => contribution.themeTemplate
): Generator<Placement> {
    const axes = [...scope.listModulesByType(ModuleType.Axis)];
    const series = [...scope.listModulesByType(ModuleType.Series)];
    for (const { definition, contribution, host, relative } of scope.optionsContributions()) {
        const template = valueOf(definition, contribution);
        if (template == null) continue;
        const label = `${definition.type}:${definition.name}@${contribution.path}`;
        const nested = nestAtOptionsPath(relative, template);
        const appliesTo = (chartType: string) => contributionMatchesChartType(contribution, chartType);
        if (host === 'chart') {
            yield* chartTemplatePlacements(scope, label, nested, appliesTo);
            continue;
        }
        const isAxis = host === 'axis';
        const matchesHost = isAxis ? contributionMatchesAxisType : contributionMatchesSeriesType;
        const hosts = (isAxis ? axes : series).filter(
            ({ name, chartType }) => appliesTo(chartType) && matchesHost(contribution, name)
        );
        for (const { name } of hosts) {
            const overrides = isAxis ? { common: { axes: { [name]: nested } } } : { [name]: { series: nested } };
            yield [`${label}[${name}]`, overrides];
        }
    }
}

/** Validates every module's `themeTemplate` where a user theme override would put it. */
function checkModuleThemeTemplates(scope: ModuleScope) {
    return checkPlacements(themeOptionsDefFor(scope), [
        ...moduleTemplatePlacements(scope),
        ...contributionTemplatePlacements(scope),
    ]);
}

/** An empty value of the shape a contribution's theme overrides take. */
function themeShapeSample(contribution: OptionsContribution): unknown {
    const validator = contribution.themeOptions ?? contribution.options;
    if (validator == null) return;
    switch (describeValidator(validator)) {
        case 'a function':
            return () => {};
        case 'an array':
        case 'an object array':
            return [];
        default:
            return {};
    }
}

/** Validates a theme-shaped value for each contribution of `scope` that `schemaScope` lacks the module for. */
function checkPlaceholderThemeShapes(scope: ModuleScope, schemaScope: ModuleScope) {
    const placements = contributionTemplatePlacements(scope, (definition, contribution) =>
        schemaScope.hasModule(definition.name) ? undefined : themeShapeSample(contribution)
    );
    return checkPlacements(themeOptionsDefFor(schemaScope), [...placements]);
}

function checkPlacements(defs: ReturnType<typeof themeOptionsDefFor>, placements: Placement[]) {
    const logger = new Logger();
    const checked: string[] = [];
    const errors: string[] = [];
    for (const [label, overrides] of placements) {
        checked.push(label);
        const { invalid } = validate({ overrides }, defs, 'theme', { logger });
        for (const error of invalid) errors.push(`${label}: ${String(error)}`);
    }
    return { checked, errors };
}

describe('module theme templates', () => {
    it('match the theme schema composed from the registered modules', () => {
        const scope = new ModuleScope();
        scope.registerModules([AllEnterpriseModule]);

        const { checked, errors } = checkModuleThemeTemplates(scope);

        expect(checked).toContain('plugin:navigator@navigator[line]');
        expect(errors).toEqual([]);
    });

    it('take the same shape from the placeholders when their modules are not registered', () => {
        const scope = new ModuleScope();
        scope.registerModules([AllEnterpriseModule]);
        const communityScope = new ModuleScope();
        communityScope.registerModules([AllCommunityModule]);

        const { checked, errors } = checkPlaceholderThemeShapes(scope, communityScope);

        expect(checked).toContain('plugin:background-regions@seriesArea.backgroundRegions[line]');
        expect(errors).toEqual([]);
    });
});
