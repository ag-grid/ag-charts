import type { LocaleManager } from '../locale/localeManager';

/**
 * The chart's accessible name from its series count, including its captions when it has any, and how many
 * annotations it has when there are any.
 */
export function seriesCountChartAriaLabel(
    localeManager: LocaleManager,
    caption: string,
    seriesCount: number,
    annotationCount = 0
): string {
    if (caption === '') {
        if (annotationCount === 0) return localeManager.t('ariaAnnounceChart', { seriesCount });
        return localeManager.t('ariaAnnounceChartWithAnnotations', { seriesCount, annotationCount });
    }
    if (annotationCount === 0) return localeManager.t('ariaAnnounceChartWithCaption', { caption, seriesCount });
    return localeManager.t('ariaAnnounceChartWithCaptionAndAnnotations', { caption, seriesCount, annotationCount });
}
