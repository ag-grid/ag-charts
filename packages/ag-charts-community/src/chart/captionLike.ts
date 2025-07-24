import type { TextSegment } from 'ag-charts-types';

import type { Text } from '../scene/shape/text';

export interface CaptionLike {
    enabled: boolean;
    text?: string | TextSegment[];
    padding: number;
    node: Text;
}
