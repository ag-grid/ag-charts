import type { AgChartOptions, Preset } from '../../options/agChartOptions';
import { candlestickVolumePreset } from './candlestickVolumePreset';

export const PRESETS: { [K in Preset['type']]: (p: Preset & { type: K }) => AgChartOptions } = {
    'candlestick-volume': candlestickVolumePreset,
};
