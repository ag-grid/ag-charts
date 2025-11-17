import { Property } from 'ag-charts-core';
import type { AgColorType } from 'ag-charts-types';

import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';

export enum HierarchyHighlightState {
    None,
    Item,
    OtherItem,
    Branch,
    OtherBranch,
}

export function toHierarchyHighlightString(
    state: HierarchyHighlightState
): 'highlighted-item' | 'unhighlighted-item' | 'highlighted-branch' | 'unhighlighted-branch' | 'none' {
    const unreachable = (a: never): never => a;
    switch (state) {
        case HierarchyHighlightState.Item:
            return 'highlighted-item';
        case HierarchyHighlightState.OtherItem:
            return 'unhighlighted-item';
        case HierarchyHighlightState.Branch:
            return 'highlighted-branch';
        case HierarchyHighlightState.OtherBranch:
            return 'unhighlighted-branch';
        case HierarchyHighlightState.None:
            return 'none';
        default:
            return unreachable(state);
    }
}

export abstract class HierarchySeriesProperties<T extends object> extends SeriesProperties<T> {
    @Property
    childrenKey: string = 'children';

    @Property
    sizeKey?: string;

    @Property
    colorKey?: string;

    @Property
    colorName?: string;

    @Property
    fills: AgColorType[] = Object.values(DEFAULT_FILLS);

    @Property
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Property
    colorRange?: string[];
}
