import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { Coords } from './annotationTypes';
import { convert, invert } from './annotationUtils';

const { BaseModuleInstance, InteractionState, Validate, BOOLEAN, createElement, REGIONS, ChartAxisDirection } =
    _ModuleSupport;

export const DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS = `ag-charts-annotations__axis-button`;

export class AxisButton extends BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = true;

    private readonly button: HTMLButtonElement;
    private readonly wrapper: HTMLElement;
    private readonly snap: boolean = false;
    private coords?: Coords;

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly axisCtx: _ModuleSupport.AxisContext,
        private readonly onButtonClick: (coords?: Coords) => void,
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
        const mouseMoveStates = InteractionState.Default | InteractionState.Annotations;

        this.destroyFns.push(
            seriesRegion.addListener('hover', (event) => this.onMouseMove(event), mouseMoveStates),
            seriesRegion.addListener('drag', (event) => this.onMouseMove(event), mouseMoveStates),
            seriesRegion.addListener('leave', () => this.onLeave()),
            () => this.destroyElements(),
            () => this.wrapper.remove(),
            () => this.button.remove()
        );
    }

    update(seriesRect: _Scene.BBox) {
        this.seriesRect = seriesRect;
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

    private onMouseMove(event: _ModuleSupport.PointerInteractionEvent<'hover' | 'drag'>) {
        if (!this.enabled) return;

        this.toggleVisibility(true);
        const buttonCoords = this.getButtonCoordinates({ x: event.offsetX, y: event.offsetY });
        this.coords = this.getAxisCoordinates(buttonCoords);
        this.updatePosition(buttonCoords);
    }

    private onLeave() {
        this.toggleVisibility(false);
    }

    private getButtonCoordinates({ x, y }: Coords) {
        const {
            axisCtx: { direction, position },
            seriesRect,
            snap,
            axisCtx,
        } = this;

        const { clientWidth: buttonWidth, clientHeight: buttonHeight } = this.button;

        const [minY, maxY] = [seriesRect.y, seriesRect.y + seriesRect.height - buttonHeight];
        const [minX, maxX] = [seriesRect.x, seriesRect.x + seriesRect.width - buttonWidth];

        if (snap) {
            x = convert(invert(x - seriesRect.x, axisCtx), axisCtx) + seriesRect.x;
            y = convert(invert(y - seriesRect.y, axisCtx), axisCtx) + seriesRect.y;
        }

        if (direction === ChartAxisDirection.X) {
            x = x - buttonWidth / 2;
            y = position === 'top' ? minY : maxY;
        } else {
            x = position === 'left' ? minX : maxX;
            y = y - buttonHeight / 2;
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

    private updatePosition({ x, y }: Coords) {
        this.wrapper.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }

    private updateButtonElement() {
        const { button } = this;
        button.onclick = _ModuleSupport.makeAccessibleClickListener(button, () => this.onButtonClick(this.coords));

        button.innerHTML = `<span class="ag-charts-icon-plus ${DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS}-icon"></span>`;
    }
}
