import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import { convert, invert } from './utils/values';

const { BaseModuleInstance, InteractionState, Validate, BOOLEAN, createElement, REGIONS, ChartAxisDirection } =
    _ModuleSupport;
const { setAttributes } = _Util;

export const DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS = `ag-charts-annotations__axis-button`;

export class AxisButton extends BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = true;

    private readonly button: HTMLButtonElement;
    private readonly wrapper: HTMLElement;
    private readonly snap: boolean = false;
    private padding: number = 0;
    private coords?: _ModuleSupport.Vec2;

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly axisCtx: _ModuleSupport.AxisContext,
        private readonly onButtonClick: (coords?: _ModuleSupport.Vec2) => void,
        private seriesRect: _Scene.BBox
    ) {
        super();

        const { button, wrapper } = this.setup();
        this.wrapper = wrapper;
        this.button = button;
        this.toggleVisibility(false);
        this.updateButtonElement();

        this.snap = axisCtx.scaleBandwidth() > 0;

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);
        const mouseMoveStates =
            InteractionState.Default | InteractionState.Annotations | InteractionState.AnnotationsSelected;

        this.destroyFns.push(
            seriesRegion.addListener('hover', (event) => this.show(event), mouseMoveStates),
            seriesRegion.addListener(
                'drag',
                (event) => this.show(event),
                InteractionState.Annotations | InteractionState.AnnotationsSelected
            ),
            seriesRegion.addListener('leave', () => this.hide(), mouseMoveStates),
            ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)),
            ctx.keyNavManager.addListener('nav-hori', () => this.onKeyPress()),
            ctx.keyNavManager.addListener('nav-vert', () => this.onKeyPress()),
            ctx.zoomManager.addListener('zoom-pan-start', () => this.hide()),
            ctx.zoomManager.addListener('zoom-change', () => this.hide()),
            () => this.destroyElements(),
            () => this.wrapper.remove(),
            () => this.button.remove()
        );
    }

    update(seriesRect: _Scene.BBox, padding: number) {
        this.seriesRect = seriesRect;
        this.padding = padding;
    }

    private setup() {
        const wrapper = this.ctx.domManager.addChild(
            'canvas-overlay',
            `${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-${this.axisCtx.axisId}`
        );
        wrapper.classList.add(`${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-wrapper`);

        const button = createElement('button');
        button.classList.add(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
        setAttributes(button, { tabindex: -1, 'aria-label': this.ctx.localeManager.t('ariaLabelAddHorizontalLine') });

        wrapper.appendChild(button);

        return {
            wrapper,
            button,
        };
    }

    private destroyElements() {
        this.ctx.domManager.removeChild('canvas-overlay', DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
    }

    private show(event: _ModuleSupport.PointerInteractionEvent<'hover' | 'drag'>) {
        const { offsetX: x, offsetY: y } = event;

        if (!(this.enabled && this.seriesRect.containsPoint(x, y))) {
            this.hide();
            return;
        }

        this.toggleVisibility(true);

        const buttonCoords = this.getButtonCoordinates({ x, y });
        this.coords = this.getAxisCoordinates(buttonCoords);
        this.updatePosition(buttonCoords);
    }

    private hide() {
        this.toggleVisibility(false);
    }

    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        if (event.currentHighlight) return;
        this.hide();
    }

    private onKeyPress() {
        if (this.snap) return;
        this.hide();
    }

    private getButtonCoordinates({ x, y }: _ModuleSupport.Vec2) {
        const {
            axisCtx: { direction, position },
            seriesRect,
            snap,
            axisCtx,
            padding,
        } = this;

        const { clientWidth: buttonWidth, clientHeight: buttonHeight } = this.button;

        const [minY, maxY] = [seriesRect.y, seriesRect.y + seriesRect.height];
        const [minX, maxX] = [seriesRect.x, seriesRect.x + seriesRect.width];

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

    private getAxisCoordinates(coords: _ModuleSupport.Vec2) {
        const { seriesRect } = this;
        const { clientWidth: buttonWidth, clientHeight: buttonHeight } = this.button;

        const x = coords.x - seriesRect.x + buttonWidth / 2;
        const y = coords.y - seriesRect.y + buttonHeight / 2;
        return {
            x,
            y,
        };
    }

    private toggleVisibility(visible: boolean) {
        const { button } = this;
        if (button == null) return;

        const isVisible = this.enabled && visible;
        this.toggleClass('-hidden', !isVisible);
    }

    private toggleClass(name: string, include: boolean) {
        this.wrapper.classList.toggle(`${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-wrapper-${name}`, include);
    }

    private updatePosition({ x, y }: _ModuleSupport.Vec2) {
        this.wrapper.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }

    private updateButtonElement() {
        const { button, ctx } = this;
        button.onclick = _ModuleSupport.makeAccessibleClickListener(button, () => this.onButtonClick(this.coords));

        button.innerHTML = `<span class="${ctx.domManager.getIconClassNames('zoom-in')} ${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-icon"></span>`;
    }
}
