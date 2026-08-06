import type { Group } from '../../scene/group';

export interface SeriesAreaContext {
    attachSeriesAreaUnderlay(group: Group<unknown>): Group<unknown>;
}
