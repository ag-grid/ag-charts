import type { Group } from '../../scene/group';

export interface SeriesAreaContext {
    attachSeriesAreaOverlay(group: Group<unknown>): Group<unknown>;
    attachSeriesAreaUnderlay(group: Group<unknown>): Group<unknown>;
}
