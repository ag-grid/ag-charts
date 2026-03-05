import { type AgRangesButtonValue, type AgRangesPosition, _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    PropertiesArray,
    Property,
    clamp,
    intervalAgo,
    isTimeInterval,
    isTimeIntervalUnit,
    isValidDate,
} from 'ag-charts-core';

import { RangesButtonProperties } from './rangesButtonProperties';

const { userInteraction, LayoutElement, Toolbar } = _ModuleSupport;

export class Ranges extends AbstractModuleInstance {
    @Property
    public enabled = false;

    @Property
    public buttons = new PropertiesArray(RangesButtonProperties);

    @Property
    public enableOutOfRange = false;

    @Property
    public position: AgRangesPosition = 'top-right';

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
            ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)),
            ctx.eventsHub.on('zoom:change-complete', this.onZoomChanged.bind(this)),
            this.teardown.bind(this)
        );
    }

    private teardown() {
        this.toolbar.getElement().remove();
        this.toolbar.destroy();
    }

    private onLayoutStart({ layoutBox }: _ModuleSupport.LayoutContext) {
        const { buttons, ctx, enabled, position, toolbar, verticalSpacing } = this;

        if (!enabled || !ctx.zoomManager.isZoomEnabled()) {
            toolbar.setHidden(true);
            return;
        }

        toolbar.setHidden(false);
        toolbar.updateButtons(buttons);

        const { width, height } = toolbar.getBounds();
        const bounds = { x: layoutBox.x, y: layoutBox.y, width, height };

        if (position === 'top' || position === 'top-left' || position === 'top-right') {
            layoutBox.shrink({ top: height + verticalSpacing });
        } else {
            bounds.y = layoutBox.y + layoutBox.height - height;
            layoutBox.shrink({ bottom: height + verticalSpacing });
        }

        if (position === 'top-right' || position === 'bottom-right') {
            bounds.x = layoutBox.x + layoutBox.width - width;
        } else if (position === 'top' || position === 'bottom') {
            bounds.x = layoutBox.x + layoutBox.width / 2 - width / 2;
        }

        toolbar.setBounds(bounds);
    }

    private onLayoutComplete({ series: { rect: seriesRect } }: _ModuleSupport.LayoutCompleteEvent) {
        const {
            ctx,
            buttons,
            enabled,
            enableOutOfRange,
            toolbar,
            ctx: { zoomManager },
        } = this;

        if (!enabled || !ctx.zoomManager.isZoomEnabled()) return;

        const bounds = toolbar.getBounds();
        bounds.x = clamp(seriesRect.x, bounds.x, seriesRect.x + seriesRect.width - bounds.width);
        toolbar.setBounds(bounds);

        let index = 0;
        for (const button of buttons) {
            let buttonEnabled = button.enabled ?? enableOutOfRange;

            if (button.enabled == null && enableOutOfRange === false) {
                const updateWithFn = this.getUpdateWithFn(button.value);
                buttonEnabled =
                    updateWithFn == null ? true : zoomManager.isValidUpdateWith(ChartAxisDirection.X, updateWithFn);
            }

            toolbar.toggleButtonEnabledByIndex(index, buttonEnabled);
            index += 1;
        }
    }

    private onZoomChanged() {
        this.toolbar.clearActiveButton();
    }

    private onButtonPress({ button: { index } }: _ModuleSupport.ToolbarEventMap['button-pressed']) {
        const { zoomManager } = this.ctx;

        const button = this.buttons.at(index);
        if (!button) return;

        const { value } = button;

        const sourcing = userInteraction(`zoom-range-button-${index}`);
        const updateWithFn = this.getUpdateWithFn(value);

        if (updateWithFn == null) {
            zoomManager.resetZoom(sourcing);
        } else {
            zoomManager.updateWith(sourcing, ChartAxisDirection.X, updateWithFn);
        }

        this.toolbar.toggleActiveButtonByIndex(index);
    }

    private getUpdateWithFn(value: AgRangesButtonValue): _ModuleSupport.UpdateZoomWithFunction | undefined {
        if (value == null) return;

        if (typeof value === 'number') {
            return (_start, end) => [Number(end) - value, undefined];
        }

        if (Array.isArray(value)) {
            return () => value;
        }

        if (typeof value === 'function') {
            return value;
        }

        if (isTimeInterval(value) || isTimeIntervalUnit(value)) {
            const [, domainMax] =
                this.ctx.axisManager.getAxisContext(ChartAxisDirection.X).at(0)?.scale.getDomainMinMax() ?? [];
            if (isValidDate(domainMax)) {
                const start = intervalAgo(value, domainMax);
                return (d0, d1) => [start ?? d0, d1];
            }
        }
    }
}
