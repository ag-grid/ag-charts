import { REGISTERED_MODULES, hasRegisteredEnterpriseModules } from '../../module/module';
import { Logger } from '../../util/logger';
import { JSON_APPLY_PLUGINS } from '../chartOptions';
import { registerAxis, registerAxisThemeTemplate } from './axisTypes';
import { registerChartDefaults } from './chartTypes';
import { getUnusedExpectedModules, verifyIfModuleExpected } from './expectedEnterpriseModules';
import { registerLegend } from './legendTypes';
import { registerSeries } from './seriesTypes';

export function setupModules() {
    for (const m of REGISTERED_MODULES) {
        if (m.packageType === 'enterprise' && !verifyIfModuleExpected(m)) {
            Logger.errorOnce('Unexpected enterprise module registered: ' + m.identifier);
        }

        if (JSON_APPLY_PLUGINS.constructors != null && m.optionConstructors != null) {
            Object.assign(JSON_APPLY_PLUGINS.constructors, m.optionConstructors);
        }

        if (m.type === 'root' && m.themeTemplate) {
            for (const chartType of m.chartTypes) {
                registerChartDefaults(chartType, m.themeTemplate);
            }
        }

        if (m.type === 'series') {
            if (m.chartTypes.length > 1) throw new Error('AG Charts - Module definition error: ' + m.identifier);

            registerSeries(
                m.identifier,
                m.chartTypes[0],
                m.instanceConstructor,
                m.seriesDefaults,
                m.themeTemplate,
                m.paletteFactory,
                m.stackable,
                m.groupable,
                m.stackedByDefault,
                m.swapDefaultAxesCondition,
                m.seriesSwappedAxesDefaults
            );
        }

        if (m.type === 'axis-option' && m.themeTemplate) {
            for (const axisType of m.axisTypes) {
                const axisTypeTheme = (m.themeTemplate as any)[axisType];
                const theme = {
                    ...m.themeTemplate,
                    ...(typeof axisTypeTheme === 'object' ? axisTypeTheme : {}),
                };
                for (const axisType of m.axisTypes) {
                    delete theme[axisType];
                }

                registerAxisThemeTemplate(axisType, theme);
            }
        }

        if (m.type === 'axis') {
            registerAxis(m.identifier, m.instanceConstructor);
            if (m.themeTemplate) {
                registerAxisThemeTemplate(m.identifier, m.themeTemplate);
            }
        }

        if (m.type === 'legend') {
            registerLegend(m.identifier, m.optionsKey, m.instanceConstructor, m.themeTemplate);
        }
    }

    if (hasRegisteredEnterpriseModules()) {
        const expectedButUnused = getUnusedExpectedModules();

        if (expectedButUnused.length > 0) {
            Logger.errorOnce('Enterprise modules expected but not registered: ', expectedButUnused);
        }
    }
}
