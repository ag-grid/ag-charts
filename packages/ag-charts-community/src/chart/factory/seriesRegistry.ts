import type { SeriesType } from 'ag-charts-types';

import type { SeriesModule } from '../../module/coreModules';
import { mergeDefaults } from '../../util/object';
import { chartTypes } from './chartTypes';

class SeriesRegistry {
    private readonly themeTemplates = new Map<string, object>();

    register(seriesType: NonNullable<SeriesType>, { chartTypes: [chartType], themeTemplate }: SeriesModule) {
        this.setThemeTemplate(seriesType, themeTemplate);
        chartTypes.set(seriesType, chartType);
    }

    setThemeTemplate(seriesType: NonNullable<SeriesType>, themeTemplate: object) {
        const currentTemplate = this.themeTemplates.get(seriesType);
        this.themeTemplates.set(seriesType, mergeDefaults(themeTemplate, currentTemplate));
    }

    getThemeTemplate(seriesType: string) {
        return this.themeTemplates.get(seriesType);
    }
}

export const seriesRegistry = new SeriesRegistry();
