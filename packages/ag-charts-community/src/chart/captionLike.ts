import type { TextOrSegments } from 'ag-charts-types';

import type { Text } from '../scene/shape/text';

export interface CaptionLike {
    enabled: boolean;
    text?: TextOrSegments;
    padding: number;
    node: Text;
}
