import { _ModuleSupport } from 'ag-charts-community';

import { RangesButtonProperties } from './rangesButtonProperties';

const { BOOLEAN, OBJECT, ChartAxisDirection, LayoutElement, PropertiesArray, Toolbar, Validate } = _ModuleSupport;

export class Ranges extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = false;

    @Validate(OBJECT)
    public buttons = new PropertiesArray(RangesButtonProperties);

    private readonly toolbar: _ModuleSupport.BaseToolbar;
    private readonly verticalSpacing = 10;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.toolbar = new Toolbar(this.ctx.localeManager);
        this.toolbar.addClass('ag-charts-range-buttons');
        ctx.domManager.addChild('canvas-overlay', 'range-buttons', this.toolbar.getElement());

        this.destroyFns.push(
            this.toolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.Toolbar, this.onLayoutStart.bind(this)),
            ctx.zoomManager.addListener('zoom-change', this.onZoomChanged.bind(this)),
            this.teardown.bind(this)
        );
    }

    private teardown() {
        this.ctx.domManager.removeChild('canvas-overlay', 'range-buttons');
        this.toolbar.destroy();
    }

    private onLayoutStart(event: _ModuleSupport.LayoutContext) {
        if (!this.enabled) return;

        const { buttons, toolbar, verticalSpacing } = this;
        const { layoutBox } = event;

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
