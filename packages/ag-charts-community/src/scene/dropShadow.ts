import { Property } from 'ag-charts-core';

import { SceneChangeDetection } from './node';
import { ChangeDetectableProperties } from './util/changeDetectableProperties';

export class DropShadow extends ChangeDetectableProperties {
    @Property
    @SceneChangeDetection()
    enabled: boolean = true;

    @Property
    @SceneChangeDetection()
    color: string = 'rgba(0, 0, 0, 0.5)';

    @Property
    @SceneChangeDetection()
    xOffset: number = 0;

    @Property
    @SceneChangeDetection()
    yOffset: number = 0;

    @Property
    @SceneChangeDetection()
    blur: number = 5;
}
