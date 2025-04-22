import { sparklineDataPreset } from './sparkline';

export const PRESET_DATA_PROCESSORS: Record<
    string,
    (data?: any[]) => { data?: any[]; series?: { xKey: string; yKey: string }[] }
> = {
    sparkline: sparklineDataPreset,
};
