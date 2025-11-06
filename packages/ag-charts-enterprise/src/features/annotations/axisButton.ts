import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { AbstractModuleInstance, type Point } from 'ag-charts-core';

import { convert, invert } from './utils/values';

const { InteractionState, Property, ChartAxisDirection, getIconClassNames } = _ModuleSupport;

export const DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS = `ag-charts-annotations__axis-button`;

export class AxisButton extends AbstractModuleInstance {
    @Property
    public enabled = true;

    private readonly button: _Widget.ButtonWidget;
    private readonly snap: boolean = false;
    private padding: number = 0;
    private coords?: Point;

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly axisCtx: _ModuleSupport.AxisContext & { snapToGroup: boolean },
        private readonly onButtonClick: (coords?: Point) => void,
        private seriesRect: _ModuleSupport.BBox
    ) {
        super();

        this.button = this.setup();
        this.toggleVisibility(false);
        this.updateButtonElement();

        this.snap = Boolean(axisCtx.scale.bandwidth);

        ctx.domManager.addEventListener('focusin', ({ target }) => {
            const htmlTarget = target instanceof HTMLElement ? target : undefined;
            const isSeriesAreaChild = htmlTarget && ctx.domManager.contains(htmlTarget, 'series-area');
            if (!isSeriesAreaChild && htmlTarget !== this.button.getElement()) this.hide();
        });

        this.cleanup.register(
            ctx.widgets.seriesWidget.addListener('drag-move', (e) => this.onMouseDrag(e)),
            ctx.widgets.seriesWidget.addListener('mousemove', (e) => this.onMouseMove(e)),
            ctx.widgets.seriesWidget.addListener('mouseleave', () => this.onMouseLeave()),
            ctx.widgets.seriesDragInterpreter?.events.on('click', (e) => this.onClick(e)),
            ctx.eventsHub.on('series:focus-change', () => this.onKeyPress()),
            ctx.eventsHub.on('zoom:pan-start', () => this.hide()),
            ctx.eventsHub.on('zoom:change-complete', () => this.hide()),
            () => this.destroyElements(),
            () => this.button.destroy()
        );
    }

    update(seriesRect: _ModuleSupport.BBox, padding: number) {
        this.seriesRect = seriesRect;
        this.padding = padding;
    }

    private setup() {
        const button = new _Widget.ButtonWidget();
        button.addClass(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
        button.setTabIndex(-1);
        button.setAriaLabel(this.ctx.localeManager.t('ariaLabelAddHorizontalLine'));
        this.ctx.widgets.seriesWidget.getElement().appendChild(button.getElement());
        return button;
    }

    private destroyElements() {
        this.ctx.domManager.removeChild('canvas-overlay', DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
    }

    private onMouseMove(e: _Widget.MouseWidgetEvent<'mousemove'>) {
        if (this.ctx.interactionManager.isState(InteractionState.Clickable)) this.show(e);
    }

    private onMouseDrag(e: _Widget.DragWidgetEvent) {
        if (this.ctx.interactionManager.isState(InteractionState.AnnotationsMoveable)) this.show(e);
    }

    private onMouseLeave() {
        if (this.ctx.interactionManager.isState(InteractionState.Clickable)) this.hide();
    }

    private onClick(e: _ModuleSupport.DragInterpreterClickEvent) {
        if (this.ctx.interactionManager.isState(InteractionState.Clickable) && e.device === 'touch') this.show(e);
    }

    private show(event: { currentX: number; currentY: number; sourceEvent: MouseEvent | TouchEvent }) {
        const { sourceEvent, currentX: x, currentY: y } = event;
        if (!(this.enabled && this.ctx.widgets.seriesWidget.getElement().contains(sourceEvent.target as Node | null))) {
            this.hide();
            return;
        }

        this.toggleVisibility(true);

        const buttonCoords = this.getButtonCoordinates({ x, y });
        this.coords = {
            x: buttonCoords.x + this.button.clientWidth / 2,
            y: buttonCoords.y + this.button.clientHeight / 2,
        };
        this.updatePosition(buttonCoords);
    }

    private hide() {
        this.toggleVisibility(false);
    }

    private onKeyPress() {
        if (this.snap && this.ctx.interactionManager.isState(InteractionState.Default)) return;
        this.hide();
    }

    private getButtonCoordinates({ x, y }: Point) {
        const {
            axisCtx: { direction, position },
            seriesRect,
            snap,
            axisCtx,
            padding,
        } = this;

        const { clientWidth: buttonWidth, clientHeight: buttonHeight } = this.button;

        const [minY, maxY] = [0, seriesRect.height];
        const [minX, maxX] = [0, seriesRect.width];

        if (snap) {
            x = convert(invert(x - seriesRect.x, axisCtx), axisCtx) + seriesRect.x;
            y = convert(invert(y - seriesRect.y, axisCtx), axisCtx) + seriesRect.y;
        }

        if (direction === ChartAxisDirection.X) {
            const crosshairLabelPadding = 5;
            const offset = buttonHeight - Math.max(0, padding - crosshairLabelPadding);

            x = x - buttonWidth / 2;
            y = position === 'top' ? minY - buttonHeight + offset : maxY - offset;
        } else {
            const crosshairLabelPadding = 9;
            const offset = buttonWidth - Math.max(0, padding - crosshairLabelPadding);

            x = position === 'left' ? minX - buttonWidth + offset : maxX - offset;
            y = y - buttonHeight / 2;
        }

        return { x, y };
    }

    private toggleVisibility(visible: boolean) {
        const { button } = this;
        if (button == null) return;

        const isVisible = this.enabled && visible;
        this.toggleClass('-hidden', !isVisible);
    }

    private toggleClass(name: string, include: boolean) {
        this.button.toggleClass(`${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-${name}`, include);
    }

    private updatePosition({ x, y }: Point) {
        this.button.getElement().style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }

    private updateButtonElement() {
        const { button } = this;
        button.addListener('click', () => this.onButtonClick(this.coords));
        button.addListener('touchend', () => this.onButtonClick(this.coords));
        button.addListener('drag-start', () => {}); // ignore drag events on this button.
        button.setInnerHTML(
            `<span class="${getIconClassNames('zoom-in')} ${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-icon"></span>`
        );
    }
}
