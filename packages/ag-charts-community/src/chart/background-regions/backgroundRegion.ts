import type { Group } from '../../scene/group';

export interface BackgroundRegion {
    regionGroup: Group;
    labelGroup: Group;
    set(properties: object): void;
}
