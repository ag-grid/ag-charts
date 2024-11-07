import { gauge } from './gauge';
import { priceVolume } from './priceVolumePreset';
import { sparkline, sparklineDataPreset } from './sparkline';

export const PRESETS = {
    'price-volume': priceVolume,
    gauge,
    sparkline,
};

export const PRESET_DATA_PROCESSORS: Partial<
    Record<keyof typeof PRESETS, (data?: any[]) => { data?: any[]; series?: { xKey: string; yKey: string }[] }>
> = {
    sparkline: sparklineDataPreset,
};
