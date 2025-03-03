import type { Series } from './series';

export interface GaugeSeries extends Series<unknown, any, any> {
    getCaptionText(): string;
}
