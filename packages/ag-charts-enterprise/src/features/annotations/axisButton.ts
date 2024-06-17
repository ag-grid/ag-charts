import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { Coords } from './annotationTypes';

const { BaseModuleInstance, Validate, BOOLEAN, createElement, REGIONS, ChartAxisDirection } = _ModuleSupport;

export const DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS = `ag-charts-annotations__axis-button`;

export class AxisButton extends BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = true;

    private readonly button: HTMLButtonElement;
    private readonly wrapper: HTMLElement;
    private coords?: Coords;

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly axisCtx: _ModuleSupport.AxisContext,
        private readonly seriesRect: _Scene.BBox,
        private readonly onButtonClick: (coords?: Coords) => void
    ) {
        super();

        const { button, wrapper } = this.setup();
        this.wrapper = wrapper;
        this.button = button;
        this.toggleVisibility(false);
        this.updateButtonElement();

        const seriesRegion = this.ctx.regionManager.getRegion(REGIONS.SERIES);

        this.destroyFns.push(
            seriesRegion.addListener('hover', (event) => this.onHover(event)),
            seriesRegion.addListener('leave', () => this.onLeave()),
            () => this.destroyElements(),
            () => this.wrapper.remove(),
            () => this.button.remove()
        );
    }

    private setup() {
        const wrapper = this.ctx.domManager.addChild(
            'canvas-overlay',
            `${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-${this.axisCtx.axisId}`
        );
        wrapper.classList.add(`${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-wrapper`);

        const button = createElement('button');
        button.classList.add(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);

        wrapper.appendChild(button);

        return {
            wrapper,
            button,
        };
    }

    private destroyElements() {
        this.ctx.domManager.removeChild('canvas-overlay', DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
    }

    private onHover(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        const { enabled } = this;
        if (!enabled) return;

        this.toggleVisibility(true);
        const buttonCoords = this.getButtonCoordinates(event);
        this.coords = this.getAxisCoordinates(buttonCoords);
        this.updatePosition(buttonCoords, this.enabled);
    }

    private onLeave() {
        this.toggleVisibility(false);
    }

    private getButtonCoordinates(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        const {
            axisCtx: { direction, position },
            seriesRect,
        } = this;

        const { clientWidth: buttonWidth, clientHeight: buttonHeight } = this.button;

        const [minY, maxY] = [seriesRect.y, seriesRect.y + seriesRect.height - buttonHeight];
        const [minX, maxX] = [seriesRect.x, seriesRect.x + seriesRect.width - buttonWidth];

        let x = 0;
        let y = 0;
        if (direction === ChartAxisDirection.X) {
            x = event.offsetX - buttonWidth / 2;
            y = position === 'top' ? minY : maxY;
        } else {
            x = position === 'left' ? minX : maxX;
            y = event.offsetY - buttonHeight / 2;
        }

        x = _Util.clamp(minX, x, maxX);
        y = _Util.clamp(minY, y, maxY);

        return { x, y };
    }

    private getAxisCoordinates(coords: Coords) {
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

    private updatePosition({ x, y }: Coords, visible: boolean) {
        if (!visible) {
            return;
        }

        this.wrapper.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }

    private updateButtonElement() {
        const { button } = this;
        button.onclick = _ModuleSupport.makeAccessibleClickListener(button, () => this.onButtonClick(this.coords));

        button.innerHTML = `<span class="ag-charts-icon-plus ${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-icon"></span>`;
    }
}
