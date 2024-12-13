import type { BBox } from '../../scene/bbox';
import type { Path } from '../../scene/shape/path';
import type { SeriesNodeDatum } from './seriesTypes';

export type PickFocusInputs = {
    // datum delta is strictly +ve/-ve when changing datum focus, or 0 when changing series focus.
    readonly datumIndex: number;
    readonly datumIndexDelta: number;
    // 'other' means 'depth' for hierarchical charts, or 'series' for all other charts
    readonly otherIndex: number;
    readonly otherIndexDelta: number;
    readonly seriesRect?: BBox;
};

export type PickFocusOutputs = {
    datumIndex: number;
    datum: SeriesNodeDatum;
    otherIndex?: number;
    bounds: BBox | Path;
    showFocusBox: boolean;
    clipFocusBox: boolean;
};
