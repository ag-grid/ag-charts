import type { Series } from './series';

export interface GaugeSeries extends Series<unknown, any, object, any, object> {
    getCaptionText(): string;
}
