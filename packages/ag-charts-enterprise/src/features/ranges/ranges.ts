import { _ModuleSupport } from 'ag-charts-community';

import { RangesButtonProperties } from './rangesButtonProperties';

const { BOOLEAN, OBJECT, ChartAxisDirection, LayoutElement, PropertiesArray, Toolbar, Validate } = _ModuleSupport;

export class Ranges extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = false;

    @Validate(OBJECT)
    public buttons = new PropertiesArray(RangesButtonProperties);

    private readonly verticalSpacing = 10;

    private readonly toolbar = new Toolbar(this.ctx, this.onButtonPress.bind(this));

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const element = this.toolbar.getElement();
        element.classList.add('ag-charts-range-buttons');
        ctx.domManager.addChild('canvas-overlay', 'range-buttons', element);

        this.destroyFns.push(
            ctx.layoutManager.registerElement(LayoutElement.Toolbar, this.onLayoutStart.bind(this)),
            ctx.zoomManager.addListener('zoom-change', this.onZoomChanged.bind(this)),
            () => this.toolbar.destroy()
        );
    }

    private onLayoutStart(event: _ModuleSupport.LayoutContext) {
        const { buttons, toolbar, verticalSpacing } = this;
        const { layoutBox } = event;

        this.toolbar.updateButtons(buttons);

        const height = toolbar.getElement().offsetHeight;
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

    private onButtonPress(event: { index: number }) {
        const { index } = event;
        const { zoomManager } = this.ctx;

        const button = this.buttons.at(index);
        if (!button) return;

        const { value } = button;

        if (typeof value === 'number') {
            zoomManager.extendToEnd('zoom-buttons', ChartAxisDirection.X, value);
        } else if (Array.isArray(value)) {
            zoomManager.updateWith('zoom-buttons', ChartAxisDirection.X, () => value);
        } else if (typeof value === 'function') {
            zoomManager.updateWith('zoom-buttons', ChartAxisDirection.X, value);
        }

        this.toolbar.toggleActiveButtonByIndex(index);
    }
}
