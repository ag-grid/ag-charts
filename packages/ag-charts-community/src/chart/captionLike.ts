import type { Text } from '../scene/shape/text';

export interface CaptionLike {
    enabled: boolean;
    text?: string;
    padding: number;
    node: Text;
}
