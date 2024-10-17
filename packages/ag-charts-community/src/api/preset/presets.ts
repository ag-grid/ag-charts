import { gauge } from './gauge';
import { priceVolume } from './priceVolumePreset';
import { sparkline } from './sparkline';

export const PRESETS = {
    'price-volume': priceVolume,
    gauge: gauge,
    sparkline: sparkline,
};
