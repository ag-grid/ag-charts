import { BOOLEAN, COLOR_STRING, NUMBER, POSITIVE_NUMBER, Validate } from '../util/validation';
import { SceneChangeDetection } from './node';
import { ChangeDetectableProperties } from './util/changeDetectableProperties';

export class DropShadow extends ChangeDetectableProperties {
    @Validate(BOOLEAN)
    @SceneChangeDetection()
    enabled: boolean = true;

    @Validate(COLOR_STRING)
    @SceneChangeDetection()
    color: string = 'rgba(0, 0, 0, 0.5)';

    @Validate(NUMBER)
    @SceneChangeDetection()
    xOffset: number = 0;

    @Validate(NUMBER)
    @SceneChangeDetection()
    yOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection()
    blur: number = 5;
}
