import type { _ModuleSupport } from 'ag-charts-community';

type CaptionedSeries = _ModuleSupport.UnknownSeries & { getCaptionText(): string };

function hasCaptionText(series: _ModuleSupport.UnknownSeries): series is CaptionedSeries {
    return 'getCaptionText' in series;
}

export function gaugeChartAriaLabel(
    localeManager: _ModuleSupport.LocaleManager,
    caption: string,
    series: readonly _ModuleSupport.UnknownSeries[]
) {
    const captions = series.filter(hasCaptionText).map((s) => s.getCaptionText());
    if (caption.length !== 0) captions.unshift(caption);
    return localeManager.t('ariaAnnounceGaugeChart', { caption: captions.join('. ') });
}
