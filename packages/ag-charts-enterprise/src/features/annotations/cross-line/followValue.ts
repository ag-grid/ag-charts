import { ChartAxisDirection, datumKeyReader } from 'ag-charts-core';
import type { AgAnnotationFollow, AgAnnotationFollowName } from 'ag-charts-types';

import type { PointType } from '../utils/scale';
import { type CrossLineDatum, type HorizontalLineDatum, horizontalLineDatum } from './crossLineDatum';

/** The part of a series that a followed value is read from. */
export interface FollowableSeries {
    readonly id: string;
    readonly visible: boolean;
    readonly data?: {
        size(): number;
        getDatumAt(datumIndex: number): unknown;
        readonly suppressFieldDotNotation?: boolean;
    };
    getKeys(direction: ChartAxisDirection): string[];
}

export interface NormalisedFollow {
    readonly follow: AgAnnotationFollowName;
    readonly seriesId?: string;
}

const FOLLOW_NAMES: readonly unknown[] = ['first', 'last'] satisfies AgAnnotationFollowName[];

function isFollowName(value: unknown): value is AgAnnotationFollowName {
    return FOLLOW_NAMES.includes(value);
}

/** Whether the line follows a series; `value` is ignored for such a line. */
export function isFollowing(datum: CrossLineDatum): datum is HorizontalLineDatum & { follow: AgAnnotationFollow } {
    return horizontalLineDatum.is(datum) && datum.follow != null;
}

export function normaliseFollow(follow: AgAnnotationFollow | undefined): NormalisedFollow | undefined {
    if (isFollowName(follow)) return { follow };
    if (follow != null && typeof follow === 'object' && isFollowName(follow.follow)) {
        return { follow: follow.follow, seriesId: follow.seriesId };
    }
}

/**
 * The series a followed annotation reads from: the one named by `seriesId`, otherwise the first visible series with
 * data bound to the y-axis. A named series must be bound to the y-axis too, as its value is drawn on that axis, but it
 * is followed even while hidden. `boundSeriesIds` is in the axis' series order.
 */
export function findFollowedSeries<S extends FollowableSeries>(
    { seriesId }: NormalisedFollow,
    series: readonly S[],
    boundSeriesIds: readonly string[]
): S | undefined {
    if (seriesId != null) return boundSeriesIds.includes(seriesId) ? series.find((s) => s.id === seriesId) : undefined;

    for (const id of boundSeriesIds) {
        const candidate = series.find((s) => s.id === id);
        if (candidate?.visible && (candidate.data?.size() ?? 0) > 0) return candidate;
    }
}

/**
 * The y value of the first or last datum of `series`: its last y key, which is the `yKey` of a single-valued series
 * and the `closeKey` of the financial series. A datum with no value (`null` or `undefined`) is skipped in favour of its
 * nearest neighbour, so this reads one row unless the edge of the data is empty. Any other value is used as it is.
 */
export function readFollowedValue(series: FollowableSeries, name: AgAnnotationFollowName): PointType | undefined {
    const { data } = series;
    const key = series.getKeys(ChartAxisDirection.Y).at(-1);
    const size = data?.size() ?? 0;
    if (data == null || key == null || size === 0) return;

    const read = datumKeyReader(key, data.suppressFieldDotNotation ?? false);
    const step = name === 'first' ? 1 : -1;
    for (let index = name === 'first' ? 0 : size - 1; index >= 0 && index < size; index += step) {
        const value = read(data.getDatumAt(index));
        if (value != null) return value as PointType;
    }
}
