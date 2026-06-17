import { _ModuleSupport } from 'ag-charts-community';
import type { AgNumericValue } from 'ag-charts-types';

type GauageTooltipInfo = { value: AgNumericValue | undefined; text: string | undefined; fallbackLabel: string };

interface GaugeSeriesLike {
    properties: {
        value: AgNumericValue;
        label: { text?: string };
        scale: { min: number; max: number };
        targets: { text?: string; value?: AgNumericValue }[];
    };
    ctx: { localeManager: _ModuleSupport.LocaleManager };
}

export function getGaugeTooltipInfo(series: GaugeSeriesLike, datumIndex: _ModuleSupport.DatumIndex): GauageTooltipInfo {
    if (datumIndex === 0) {
        const value = series.properties.value;
        const text = series.properties.label.text;
        const fallbackLabel = series.ctx.localeManager.t('ariaLabelGaugeValue');
        return { value, text, fallbackLabel };
    } else {
        const { value, text } = series.properties.targets.at(datumIndex - 1) ?? {};
        const fallbackLabel = series.ctx.localeManager.t('ariaLabelGaugeTarget');
        return { value, text, fallbackLabel };
    }
}
