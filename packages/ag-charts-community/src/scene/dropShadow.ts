import { BOOLEAN, COLOR_STRING, NUMBER, POSITIVE_NUMBER, TempValidate } from '../util/validation';
import { SceneChangeDetection } from './node';
import { ChangeDetectableProperties } from './util/changeDetectableProperties';

export class DropShadow extends ChangeDetectableProperties {
    @TempValidate(BOOLEAN)
    @SceneChangeDetection()
    enabled: boolean = true;

    @TempValidate(COLOR_STRING)
    @SceneChangeDetection()
    color: string = 'rgba(0, 0, 0, 0.5)';

    @TempValidate(NUMBER)
    @SceneChangeDetection()
    xOffset: number = 0;

    @TempValidate(NUMBER)
    @SceneChangeDetection()
    yOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    @SceneChangeDetection()
    blur: number = 5;
}
