import { createElement } from 'ag-charts-core';

import { NativeWidget } from './nativeWidget';

/**
 * Proxy element for a single axis. Exposed as `role="region"` when an interaction feature is
 * active, and optionally wraps the axis title text (a `BoundedTextWidget`) so the title is a
 * descendant of the region — remaining hit-testable rather than being occluded by it.
 *
 * Lifecycle, DOM attachment and title re-parenting are owned by `AxisWidgets`; this class only
 * provides the distinct widget type.
 */
export class AxisWidget extends NativeWidget<HTMLDivElement> {
    constructor() {
        super(createElement('div'));
    }
}
