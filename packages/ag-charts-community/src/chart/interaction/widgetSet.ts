import type { DOMManager } from '../../dom/domManager';
import { NativeWidget } from '../../widget/nativeWidget';
import { type Widget } from '../../widget/widget';

class DOMManagerWidget extends NativeWidget<HTMLElement> {
    constructor(elem: HTMLElement) {
        super(elem);
    }

    // Adding/removing elements from the DOM is managed by the DOMManager
    /* eslint-disable sonarjs/no-empty-function */
    protected override addChildToDOM() {}
    protected override removeChildFromDOM() {}
    /* eslint-enable sonarjs/no-empty-function */
}

export class WidgetSet {
    readonly seriesWidget: Widget;
    readonly chartWidget: Widget;
    readonly containerWidget: Widget;

    constructor(domManager: DOMManager) {
        this.seriesWidget = new DOMManagerWidget(domManager.getParent('series-area'));
        this.chartWidget = new DOMManagerWidget(domManager.getParent('canvas-proxy'));
        this.containerWidget = new DOMManagerWidget(domManager.getParent('canvas-container'));
        this.containerWidget.addChild(this.chartWidget);
        this.chartWidget.addChild(this.seriesWidget);
    }
}
