import { BOOLEAN, COLOR_STRING, NUMBER, POSITIVE_NUMBER, Validate } from '../util/validation';
import { RedrawType } from './changeDetectable';
import { SceneChangeDetection } from './node';
import { ChangeDetectableProperties } from './util/changeDetectableProperties';

export class DropShadow extends ChangeDetectableProperties {
    @Validate(BOOLEAN)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    enabled: boolean = true;

    @Validate(COLOR_STRING)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    color: string = 'rgba(0, 0, 0, 0.5)';

    @Validate(NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    xOffset: number = 0;

    @Validate(NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    yOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    blur: number = 5;
}
