import type { Series } from './series';

export interface GaugeSeries extends Series<any, any, any> {
    getCaptionText(): string;
}
