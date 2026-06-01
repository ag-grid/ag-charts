import type { Series } from './series';
import type { SeriesNodeDatum } from './seriesTypes';

export interface GaugeSeries extends Series<SeriesNodeDatum, object, any> {
    getCaptionText(): string;
}
