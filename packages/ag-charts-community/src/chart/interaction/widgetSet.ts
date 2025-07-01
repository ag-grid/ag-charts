import type { DOMManager } from '../../dom/domManager';
import { NativeWidget } from '../../widget/nativeWidget';
import { type Widget } from '../../widget/widget';
import { DragInterpreter } from './dragInterpreter';

class DOMManagerWidget extends NativeWidget {
    constructor(elem: HTMLElement) {
        super(elem);
    }

    protected override addChildToDOM() {
        // Adding/removing elements from the DOM is managed by the DOMManager
    }
    protected override removeChildFromDOM() {
        // Adding/removing elements from the DOM is managed by the DOMManager
    }
}

export class WidgetSet {
    readonly seriesWidget: Widget;
    readonly chartWidget: Widget;
    readonly containerWidget: Widget;
    readonly seriesDragInterpreter?: DragInterpreter;

    constructor(domManager: DOMManager, opts: { withDragInterpretation: boolean }) {
        this.seriesWidget = new DOMManagerWidget(domManager.getParent('series-area'));
        this.chartWidget = new DOMManagerWidget(domManager.getParent('canvas-proxy'));
        this.containerWidget = new DOMManagerWidget(domManager.getParent('canvas-container'));
        this.containerWidget.addChild(this.chartWidget);
        this.chartWidget.addChild(this.seriesWidget);

        if (opts.withDragInterpretation) {
            this.seriesDragInterpreter = new DragInterpreter(this.seriesWidget);
        } else {
            this.seriesDragInterpreter = undefined;
        }
    }

    destroy(): void {
        this.seriesDragInterpreter?.destroy();
        this.seriesWidget.destroy();
        this.chartWidget.destroy();
        this.containerWidget.destroy();
    }
}
