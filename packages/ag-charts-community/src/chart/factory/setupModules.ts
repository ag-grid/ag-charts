import { REGISTERED_MODULES, hasRegisteredEnterpriseModules } from '../../module/module';
import { Logger } from '../../util/logger';
import { axisThemes, axisTypes } from './axisTypes';
import { chartDefaults } from './chartTypes';
import { getUnusedExpectedModules, verifyIfModuleExpected } from './expectedEnterpriseModules';
import { legendRegistry } from './legendRegistry';
import { seriesRegistry } from './seriesRegistry';

export function setupModules() {
    for (const m of REGISTERED_MODULES) {
        if (m.packageType === 'enterprise' && !verifyIfModuleExpected(m)) {
            Logger.errorOnce('Unexpected enterprise module registered: ' + m.identifier);
        }

        if (m.type === 'root' && m.themeTemplate) {
            for (const chartType of m.chartTypes) {
                chartDefaults.set(chartType, m.themeTemplate);
            }
        }

        if (m.type === 'series') {
            if (m.chartTypes.length > 1) {
                throw new Error(`AG Charts - Module definition error: ${m.identifier}`);
            }
            seriesRegistry.register(m.identifier, m);
        }

        if (m.type === 'series-option' && m.themeTemplate) {
            for (const seriesType of m.seriesTypes) {
                seriesRegistry.setThemeTemplate(seriesType, m.themeTemplate);
            }
        }

        if (m.type === 'axis-option' && m.themeTemplate) {
            for (const axisType of m.axisTypes) {
                const axisTypeTheme = m.themeTemplate[axisType];
                const theme = { ...m.themeTemplate, ...axisTypeTheme };
                for (const axisType of m.axisTypes) {
                    delete theme[axisType];
                }

                axisThemes.set(axisType, theme);
            }
        }

        if (m.type === 'axis') {
            axisTypes.set(m.identifier, m.instanceConstructor);
            if (m.themeTemplate) {
                axisThemes.set(m.identifier, m.themeTemplate);
            }
        }

        if (m.type === 'legend') {
            legendRegistry.register(m.identifier, m);
        }
    }

    if (hasRegisteredEnterpriseModules()) {
        const expectedButUnused = getUnusedExpectedModules();

        if (expectedButUnused.length > 0) {
            Logger.errorOnce('Enterprise modules expected but not registered: ', expectedButUnused);
        }
    }
}
