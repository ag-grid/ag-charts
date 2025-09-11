import type { Series } from './series';
import type { DatumIndexType } from './seriesTypes';

export interface GaugeSeries extends Series<DatumIndexType, any, object, any> {
    getCaptionText(): string;
}
