import type { NormalisedTextOrSegments } from 'ag-charts-core';

import type { Text } from '../scene/shape/text';

export interface CaptionLike {
    enabled: boolean;
    text?: NormalisedTextOrSegments;
    padding: number;
    node: Text;
}
