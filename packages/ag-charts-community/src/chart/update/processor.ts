import type { Scale } from '../../scale/scale';
import type { Group } from '../../scene/group';
import type { Padding } from '../../util/padding';

/** Interface to abstract from the actual chart implementation. */
export interface ChartLike {
    axes: AxisLike[];
    series: SeriesLike[];
    seriesArea: { clip?: boolean };
    seriesRoot: Group;
    padding: Padding;
}

export interface AxisLike {
    id: string;
    type: string;
    scale: Scale<any, any>;
}

export interface SeriesLike {
    hasData: boolean;
    visible: boolean;
}

export interface UpdateProcessor {
    destroy(): void;
}
