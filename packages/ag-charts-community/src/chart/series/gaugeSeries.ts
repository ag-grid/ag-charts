import type { Series } from './series';

export interface GaugeSeries extends Series<any, object, any> {
    getCaptionText(): string;
}
