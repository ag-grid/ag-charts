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
    ActionOnSet,
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

type ZoomButtonsVisible = 'always' | 'zoomed' | 'hover';

export class ZoomToolbar extends BaseProperties {
    @Validate(BOOLEAN)
    @ActionOnSet<ZoomToolbar>({
        changeValue(enabled) {
            this.toolbar?.setHidden(!enabled);
        },
    })
    public enabled?: boolean = false;

    @Validate(ARRAY)
    public buttons = new PropertiesArray(ZoomButtonProperties);

    @Validate(UNION(['always', 'zoomed', 'hover']))
    @ActionOnSet<ZoomToolbar>({
        changeValue(visible: ZoomButtonsVisible, oldValue: any) {
            if (oldValue == null) return;
            this.toggleVisibility(visible === 'always');
        },
    })
    public visible: ZoomButtonsVisible = 'hover';

    private readonly verticalSpacing = 10;
    private readonly detectionRange = 38;

    private readonly container: _ModuleSupport.NativeWidget<HTMLDivElement>;
    private readonly toolbar: _ModuleSupport.Toolbar<ZoomToolbarButtonOptions>;

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
        ) => void,
        private readonly resetZoom: () => void
    ) {
        super();

        this.container = new NativeWidget(createElement('div'));
        this.container.addClass('ag-charts-zoom-buttons');
        ctx.domManager.addChild('canvas-overlay', 'zoom-buttons', this.container.getElement());

        this.toolbar = new Toolbar<ZoomToolbarButtonOptions>(ctx.localeManager);
        this.container.addChild(this.toolbar);

        this.toggleVisibility(this.visible === 'always');

        this.destroyFns.push(
            this.toolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this)),
            this.toolbar.addToolbarListener('button-focused', this.onButtonFocus.bind(this)),
            ctx.interactionManager.addListener('hover', this.onHover.bind(this), InteractionState.All),
            ctx.interactionManager.addListener('leave', this.onLeave.bind(this), InteractionState.All),
            ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)),
            this.teardown.bind(this)
        );
    }

    public destroy() {
        for (const fn of this.destroyFns) {
            fn();
        }
    }

    public toggleVisibleZoomed(isMaxZoom: boolean) {
        if (this.visible !== 'zoomed') return;
        this.toggleVisibility(!isMaxZoom);
    }

    private teardown() {
        this.ctx.domManager.removeChild('canvas-overlay', 'zoom-buttons');
        this.container.destroy();
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const { buttons, container } = this;
        const { rect } = event.series;

        this.toolbar.updateButtons(buttons);
        this.toggleButtons();

        const height = container.getBounds().height;
        container.setBounds({ y: rect.y + rect.height - height });
    }

    private onHover(event: _ModuleSupport.PointerInteractionEvent<'hover'>) {
        if (!this.enabled || this.visible !== 'hover' || this.toolbar.isHidden()) return;

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
        if (this.visible !== 'hover') return;
        this.toggleVisibility(false);
    }

    private toggleVisibility(visible: boolean, immediate: boolean = false) {
        const { container, toolbar, verticalSpacing } = this;

        toolbar.toggleClass('ag-charts-zoom-buttons__toolbar--hidden', !visible);

        const element = toolbar.getElement();
        element.style.transitionDuration = immediate ? '0s' : '';
        element.style.transform = visible
            ? 'translateY(0)'
            : `translateY(${container.getBounds().height + verticalSpacing}px)`;
    }

    private toggleButtons() {
        const zoom = definedZoomState(this.ctx.zoomManager.getZoom());
        const { minRatioX, minRatioY } = this.getModuleProperties();

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
                    enabled = !isZoomLess(zoom, minRatioX, minRatioY);
                    break;
                case 'reset':
                    enabled = !isZoomEqual(zoom, this.getResetZoom());
                    break;
            }

            this.toolbar.toggleButtonEnabledByIndex(index, enabled);
        }
    }

    private onButtonPress({ button }: _ModuleSupport.ToolbarEventMap<ZoomToolbarButtonOptions>['button-pressed']) {
        if (!this.enabled || this.toolbar.isHidden()) return;

        const props = this.getModuleProperties();

        if (props.independentAxes && button.value !== 'reset') {
            const axisZooms = this.ctx.zoomManager.getAxisZooms();
            for (const [axisId, { direction, zoom }] of Object.entries(axisZooms)) {
                if (zoom == null) continue;
                this.onButtonPressAxis(button, props, axisId, direction, zoom);
            }
        } else {
            this.onButtonPressUnified(button, props);
        }
    }

    private onButtonFocus(_event: _ModuleSupport.ToolbarEventMap<ZoomToolbarButtonOptions>['button-focused']) {
        this.toggleVisibility(true, true);
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
                this.resetZoom();
                return;

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
