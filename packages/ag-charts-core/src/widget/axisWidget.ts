import { createElement } from '../dom/domElements';
import { NativeWidget } from './nativeWidget';

/**
 * Proxy element for a single axis, created when an interaction feature is active. It has no role
 * or accessible name, so it is not a landmark. It optionally wraps the axis title text (a
 * `BoundedTextWidget`) so the title is a descendant of the element — remaining hit-testable rather
 * than being occluded by it.
 *
 * Lifecycle, DOM attachment and title re-parenting are owned by `AxisWidgets`; this class only
 * provides the distinct widget type.
 */
export class AxisWidget extends NativeWidget<HTMLDivElement> {
    constructor() {
        super(createElement('div'));
    }
}
