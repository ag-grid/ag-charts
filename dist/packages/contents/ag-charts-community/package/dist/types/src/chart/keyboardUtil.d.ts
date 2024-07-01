import { BBox } from '../scene/bbox';
import type { Path } from '../scene/shape/path';
import type { FocusIndicator } from './dom/focusIndicator';
import type { TooltipPointerEvent } from './tooltip/tooltip';
export declare function makeKeyboardPointerEvent(focusIndicator: FocusIndicator | undefined, pick: {
    bounds: Path | BBox | undefined;
    showFocusBox: boolean;
}): TooltipPointerEvent<'keyboard'> | undefined;
