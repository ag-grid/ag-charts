import type { AgChartLabelFormatterParams, Formatter, _ModuleSupport, _Scene } from 'ag-charts-community';

export interface GaugeFormatterParams {}

export interface GaugeLabelDatum {
    value: number;
    text?: string;
    formatter?: Formatter<AgChartLabelFormatterParams<any>>;
}

export const fadeInFns: _ModuleSupport.FromToFns<_Scene.Node, any, any> = {
    fromFn: () => ({ opacity: 0, phase: 'initial' }),
    toFn: () => ({ opacity: 1 }),
};

export function formatLabel(value: number | undefined, axis: _ModuleSupport.ChartAxis | undefined) {
    if (value == null) return '';
    if (axis == null) return String(value);

    const [min, max] = axis.scale.domain;
    const minLog10 = min !== 0 ? Math.ceil(Math.log10(Math.abs(min))) : 0;
    const maxLog10 = max !== 0 ? Math.ceil(Math.log10(Math.abs(max))) : 0;
    const dp = Math.max(2 - Math.max(minLog10, maxLog10), 0);
    return value.toFixed(dp);
}

export function getLabelText(series: _ModuleSupport.Series<any, any>, datum: GaugeLabelDatum, valueOverride?: number) {
    if (datum.text != null) return datum.text;

    const value = valueOverride ?? datum.value;
    const labelFormat = datum?.formatter?.({ seriesId: series.id, datum: undefined, value });
    if (labelFormat != null) return String(labelFormat);
}
