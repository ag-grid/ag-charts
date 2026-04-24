import type { AgAxisLineOptions } from 'ag-charts-types';

const DEFAULTS = {
    enabled: true,
    width: 1,
    stroke: undefined as string | undefined,
};

export class AxisLine {
    enabled = DEFAULTS.enabled;
    width: number = DEFAULTS.width;
    stroke?: string = DEFAULTS.stroke;

    applyOptions(options: AgAxisLineOptions | undefined): void {
        // "options replace state": reset to class defaults first, then overlay user values.
        // Keys are restricted to the DEFAULTS shape so unknown options don't pollute the instance.
        for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
            const override = options != null && key in options ? (options as any)[key] : DEFAULTS[key];
            (this as any)[key] = override;
        }
    }
}
