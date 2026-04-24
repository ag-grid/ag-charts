import type { AgAxisGridLineOptions, AgAxisGridStyle } from 'ag-charts-types';

const DEFAULT_STYLE: AgAxisGridStyle[] = [
    {
        fill: undefined,
        fillOpacity: 1,
        stroke: undefined,
        strokeWidth: undefined,
        lineDash: [],
    },
];

const DEFAULTS = {
    enabled: true,
    width: 1,
    style: DEFAULT_STYLE,
};

export class AxisGridLine {
    enabled = DEFAULTS.enabled;
    width: number = DEFAULTS.width;
    style: AgAxisGridStyle[] = DEFAULTS.style;

    applyOptions(options: AgAxisGridLineOptions | undefined): void {
        for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
            const override = options != null && key in options ? (options as any)[key] : DEFAULTS[key];
            (this as any)[key] = override;
        }
    }
}
