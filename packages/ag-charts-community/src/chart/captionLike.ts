import type { NormalisedTextOrSegments, Text } from 'ag-charts-core';

export interface CaptionLike {
    enabled: boolean;
    text?: NormalisedTextOrSegments;
    padding: number;
    node: Text;
}
