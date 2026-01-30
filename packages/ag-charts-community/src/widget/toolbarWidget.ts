import type { AgDocumentLike } from 'ag-charts-core';
import type { ButtonWidget } from './buttonWidget';
import type { NativeWidget } from './nativeWidget';
import type { RovingDirection } from './rovingDirection';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import type { SliderWidget } from './sliderWidget';

export class ToolbarWidget extends RovingTabContainerWidget<ButtonWidget | SliderWidget | NativeWidget> {
    constructor(orientation: RovingDirection = 'horizontal', document?: AgDocumentLike) {
        super(orientation, 'toolbar', document);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
