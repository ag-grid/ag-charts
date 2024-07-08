import { _Scene } from 'ag-charts-community';

import { Annotation } from '../scenes/annotationScene';

export class TextScene extends Annotation {
    static override is(value: unknown): value is TextScene {
        return Annotation.isCheck(value, 'text');
    }

    override type = 'text';
    override activeHandle?: string | undefined;

    constructor() {
        super();
    }

    override toggleHandles(_show: boolean | Partial<Record<'start' | 'end', boolean>>) {}

    override toggleActive(_active: boolean) {}

    override stopDragging() {}

    override getAnchor() {
        const bbox = this.getCachedBBoxWithoutHandles();
        return { x: bbox.x + bbox.width / 2, y: bbox.y };
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return 'default';
    }

    override containsPoint(_x: number, _y: number) {
        return false;
    }
}
