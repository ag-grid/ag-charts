import type { _ModuleSupport } from 'ag-charts-community';

export function formatLabel(value: number, axis: _ModuleSupport.ChartAxis | undefined) {
    if (axis == null) return String(value);

    const [min, max] = axis.scale.domain;
    const minLog10 = min !== 0 ? Math.ceil(Math.log10(Math.abs(min))) : 0;
    const maxLog10 = max !== 0 ? Math.ceil(Math.log10(Math.abs(max))) : 0;
    const dp = Math.max(2 - Math.max(minLog10, maxLog10), 0);
    return value.toFixed(dp);
}
