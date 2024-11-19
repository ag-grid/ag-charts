import { type AgZoomButtonValue, _ModuleSupport } from 'ag-charts-community';

import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT,
    constrainAxis,
    constrainZoom,
    definedZoomState,
    dx,
    isZoomEqual,
    isZoomLess,
    scaleZoom,
    scaleZoomAxisWithAnchor,
    translateZoom,
    unitZoomState,
} from './zoomUtils';

const {
    ARRAY,
    BOOLEAN,
    STRING,
    UNION,
    BaseProperties,
    ChartAxisDirection,
    InteractionState,
    NativeWidget,
    PropertiesArray,
    Toolbar,
    ToolbarButtonProperties,
    Validate,
    createElement,
} = _ModuleSupport;

class ZoomButtonProperties extends ToolbarButtonProperties {
    @Validate(UNION(['reset', 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-start', 'pan-end']))
    value!: 'reset' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-start' | 'pan-end';

    @Validate(STRING)
    section!: string;
}

interface ZoomToolbarButtonOptions extends _ModuleSupport.ToolbarButtonOptions {
    value: AgZoomButtonValue;
}

export class ZoomToolbar extends BaseProperties {
    @Validate(BOOLEAN)
    public enabled?: boolean = false;

    @Validate(ARRAY)
    public buttons = new PropertiesArray(ZoomButtonProperties);

    private readonly verticalSpacing = 10;
    private readonly detectionRange = 38;

    private readonly container: _ModuleSupport.NativeWidget<HTMLDivElement>;
    private readonly toolbar = new Toolbar<ZoomToolbarButtonOptions>(this.ctx, this.onButtonPress.bind(this));

    private readonly destroyFns: Array<() => void> = [];

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly getModuleProperties: () => ZoomProperties,
        private readonly getResetZoom: () => DefinedZoomState,
        private readonly updateZoom: (zoom: DefinedZoomState) => void,
        private readonly updateAxisZoom: (
            axisId: string,
            direction: _ModuleSupport.ChartAxisDirection,
            partialZoom: _ModuleSupport.ZoomState | undefined
        ) => void
    ) {
        super();

        this.container = new NativeWidget(createElement('div'));
        const element = this.container.getElement();
        element.classList.add('ag-charts-zoom-buttons');
        ctx.domManager.addChild('canvas-overlay', 'zoom-buttons', element);

        this.container.appendChild(this.toolbar);

        this.toggleVisibility(false);

        this.destroyFns.push(
            ctx.interactionManager.addListener('hover', this.onHover.bind(this), InteractionState.All),
            ctx.interactionManager.addListener('leave', this.onLeave.bind(this), InteractionState.All),
            ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)),
            () => this.container.destroy()
        );
    }

    public destroy() {
        for (const fn of this.destroyFns) {
            fn();
        }
    }

    public toggle(enabled: boolean | undefined, zoom: DefinedZoomState, props: ZoomProperties) {
        if (!enabled) return;
        this.toggleButtons(zoom, props);
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const { buttons, container } = this;
        const { rect } = event.series;

        this.toolbar.updateButtons(buttons);
        this.toggleButtons(definedZoomState(this.ctx.zoomManager.getZoom()), this.getModuleProperties());

        const height = container.getElement().offsetHeight;
        container.setBounds({ y: rect.y + rect.height - height });
    }

    private onHover(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        const {
            container,
            detectionRange,
            ctx: { scene },
        } = this;
        const {
            offsetY,
            sourceEvent: { target },
        } = event;

        const element = container.getElement();
        const detectionY = element.offsetTop - detectionRange;
        const visible = (offsetY > detectionY && offsetY < scene.canvas.element.offsetHeight) || target === element;

        this.toggleVisibility(visible);
    }

    private onLeave() {
        this.toggleVisibility(false);
    }

    private toggleVisibility(visible: boolean) {
        const { container, toolbar, verticalSpacing } = this;

        const element = toolbar.getElement();

        element.classList.toggle('ag-charts-zoom-buttons__toolbar--hidden', !visible);
        element.style.transform = visible
            ? 'translateY(0)'
            : `translateY(${container.getElement().offsetHeight + verticalSpacing}px)`;
    }

    private toggleButtons(zoom: DefinedZoomState, props: ZoomProperties) {
        for (const [index, button] of this.buttons.entries()) {
            let enabled = true;

            switch (button?.value) {
                case 'pan-start':
                    enabled = zoom.x.min > UNIT.min;
                    break;
                case 'pan-end':
                    enabled = zoom.x.max < UNIT.max;
                    break;
                case 'pan-left':
                    enabled = zoom.x.min > UNIT.min;
                    break;
                case 'pan-right':
                    enabled = zoom.x.max < UNIT.max;
                    break;
                case 'zoom-out':
                    enabled = !isZoomEqual(zoom, unitZoomState());
                    break;
                case 'zoom-in':
                    enabled = !isZoomLess(zoom, props.minRatioX, props.minRatioY);
                    break;
                case 'reset':
                    enabled = !isZoomEqual(zoom, this.getResetZoom());
                    break;
            }

            this.toolbar.toggleButtonEnabledByIndex(index, enabled);
        }
    }

    private onButtonPress(event: { value: AgZoomButtonValue }) {
        const props = this.getModuleProperties();

        if (props.independentAxes && event.value !== 'reset') {
            const axisZooms = this.ctx.zoomManager.getAxisZooms();
            for (const [axisId, { direction, zoom }] of Object.entries(axisZooms)) {
                if (zoom == null) continue;
                this.onButtonPressAxis(event, props, axisId, direction, zoom);
            }
        } else {
            this.onButtonPressUnified(event, props);
        }
    }

    private onButtonPressAxis(
        event: { value: AgZoomButtonValue },
        props: ZoomProperties,
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        zoom: _ModuleSupport.ZoomState
    ) {
        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        let newZoom = { ...zoom };
        const delta = zoom.max - zoom.min;

        switch (event.value) {
            case 'pan-start':
                newZoom.max = delta;
                newZoom.min = 0;
                break;

            case 'pan-end':
                newZoom.min = newZoom.max - delta;
                newZoom.max = UNIT.max;
                break;

            case 'pan-left':
                newZoom.min -= delta * scrollingStep;
                newZoom.max -= delta * scrollingStep;
                break;

            case 'pan-right':
                newZoom.min += delta * scrollingStep;
                newZoom.max += delta * scrollingStep;
                break;

            case 'zoom-in':
            case 'zoom-out': {
                const isDirectionX = direction === ChartAxisDirection.X;
                const isScalingDirection = (isDirectionX && isScalingX) || (!isDirectionX && isScalingY);

                let scale = event.value === 'zoom-in' ? 1 - scrollingStep : 1 + scrollingStep;
                if (!isScalingDirection) scale = 1;

                const useAnchorPointX = anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
                const useAnchorPointY = anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;
                const useAnchorPoint = isDirectionX ? useAnchorPointX : useAnchorPointY;

                newZoom.max = newZoom.min + (newZoom.max - newZoom.min) * scale;
                newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, useAnchorPoint);
                break;
            }
        }

        this.updateAxisZoom(axisId, direction, constrainAxis(newZoom));
    }

    private onButtonPressUnified(event: { value: AgZoomButtonValue }, props: ZoomProperties) {
        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        const oldZoom = definedZoomState(this.ctx.zoomManager.getZoom());
        let zoom = definedZoomState(oldZoom);

        switch (event.value) {
            case 'reset':
                zoom = this.getResetZoom();
                break;

            case 'pan-start':
                zoom.x.max = dx(zoom);
                zoom.x.min = 0;
                break;

            case 'pan-end':
                zoom.x.min = UNIT.max - dx(zoom);
                zoom.x.max = UNIT.max;
                break;

            case 'pan-left':
                zoom = translateZoom(zoom, -dx(zoom) * scrollingStep, 0);
                break;

            case 'pan-right':
                zoom = translateZoom(zoom, dx(zoom) * scrollingStep, 0);
                break;

            case 'zoom-in':
            case 'zoom-out': {
                const scale = event.value === 'zoom-in' ? 1 - scrollingStep : 1 + scrollingStep;
                const useAnchorPointX = anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
                const useAnchorPointY = anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;

                zoom = scaleZoom(zoom, isScalingX ? scale : 1, isScalingY ? scale : 1);
                zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, useAnchorPointX);
                zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, useAnchorPointY);
                break;
            }
        }

        this.updateZoom(constrainZoom(zoom));
    }
}
