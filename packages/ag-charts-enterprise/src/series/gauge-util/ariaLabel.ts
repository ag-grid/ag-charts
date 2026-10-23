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
    const captions: string[] = [];
    if (caption.length !== 0) {
        captions.push(caption);
    }
    for (const s of series) {
        if (hasCaptionText(s)) captions.push(s.getCaptionText());
    }
    return localeManager.t('ariaAnnounceGaugeChart', { caption: captions.join('. ') });
}
