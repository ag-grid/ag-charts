import type { LocaleManager } from '../locale/localeManager';

/** The chart's accessible name from its series count, including its captions when it has any. */
export function seriesCountChartAriaLabel(localeManager: LocaleManager, caption: string, seriesCount: number): string {
    if (caption === '') {
        return localeManager.t('ariaAnnounceChart', { seriesCount });
    }
    return localeManager.t('ariaAnnounceChartWithCaption', { caption, seriesCount });
}
