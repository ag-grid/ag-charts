import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance } from 'ag-charts-core';

import { RangesButtonProperties } from './rangesButtonProperties';

const { ChartAxisDirection, LayoutElement, PropertiesArray, Toolbar, Property } = _ModuleSupport;

const ZOOM_ID = 'ranges';

export class Ranges extends AbstractModuleInstance {
    @Property
    public enabled = false;

    @Property
    public buttons = new PropertiesArray(RangesButtonProperties);

    private readonly container: HTMLElement;
    private readonly toolbar: _ModuleSupport.BaseToolbar;
    private readonly verticalSpacing = 10;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.container = ctx.domManager.addChild('canvas-overlay', 'range-buttons');
        this.container.role = 'presentation';

        this.toolbar = new Toolbar(this.ctx, 'ariaLabelRangesToolbar', 'horizontal');
        this.toolbar.addClass('ag-charts-range-buttons');
        this.container.append(this.toolbar.getElement());

        this.cleanup.register(
            this.toolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.ToolbarBottom, this.onLayoutStart.bind(this)),
            ctx.eventsHub.on('zoom:change-request', this.onZoomChanged.bind(this)),
            this.teardown.bind(this)
        );
    }

    private teardown() {
        this.toolbar.getElement().remove();
        this.toolbar.destroy();
    }

    private onLayoutStart({ layoutBox }: _ModuleSupport.LayoutContext) {
        const { buttons, ctx, enabled, toolbar, verticalSpacing } = this;

        if (!enabled || !ctx.zoomManager.isZoomEnabled()) {
            toolbar.setHidden(true);
            return;
        }

        toolbar.setHidden(false);
        toolbar.updateButtons(buttons);

        const height = toolbar.getBounds().height;
        toolbar.setBounds({
            x: layoutBox.x,
            y: layoutBox.y + layoutBox.height - height,
            width: layoutBox.width,
            height: height,
        });

        layoutBox.shrink({ bottom: height + verticalSpacing });
    }

    private onZoomChanged() {
        this.toolbar.clearActiveButton();
    }

    private onButtonPress({ button: { index } }: _ModuleSupport.ToolbarEventMap['button-pressed']) {
        const { zoomManager } = this.ctx;

        const button = this.buttons.at(index);
        if (!button) return;

        const { value } = button;

        if (value == null) {
            zoomManager.resetZoom(ZOOM_ID);
        } else if (typeof value === 'number') {
            zoomManager.extendToEnd(ZOOM_ID, ChartAxisDirection.X, value);
        } else if (Array.isArray(value)) {
            zoomManager.updateWith(ZOOM_ID, ChartAxisDirection.X, () => value);
        } else if (typeof value === 'function') {
            zoomManager.updateWith(ZOOM_ID, ChartAxisDirection.X, value);
        }

        this.toolbar.toggleActiveButtonByIndex(index);
    }
}
