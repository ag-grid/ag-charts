import type { Text } from '../scene/shape/text';

export interface CaptionLike {
    enabled: boolean;
    text?: string;
    spacing: number;
    node: Text;
}
