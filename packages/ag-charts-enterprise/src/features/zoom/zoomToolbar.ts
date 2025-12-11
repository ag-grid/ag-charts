import { type AgZoomAnchorPoint, type AgZoomButtonValue, _ModuleSupport, _Widget } from 'ag-charts-community';
import type { AxisID, CartesianAxisDirection } from 'ag-charts-core';
import {
    ActionOnSet,
    BaseProperties,
    ChartAxisDirection,
    CleanupRegistry,
    PropertiesArray,
    Property,
    createElement,
    debounce,
    entries,
} from 'ag-charts-core';

import { ToolbarButtonProperties } from '../toolbar/buttonProperties';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT_MAX,
    UNIT_MIN,
    ZOOM_VALID_CHECK_DEBOUNCE,
    canResetZoom,
    constrainAxis,
    constrainZoom,
    definedZoomState,
    dx,
    isMaxZoom,
    isZoomEqual,
    scaleZoom,
    scaleZoomAxisWithAnchor,
    translateZoom,
    unitZoomState,
} from './zoomUtils';

const { userInteraction, NativeWidget, Toolbar } = _ModuleSupport;

class ZoomButtonProperties extends ToolbarButtonProperties {
    @Property
    value!: 'reset' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-start' | 'pan-end';

    @Property
    section!: string;
}

interface ZoomToolbarButtonOptions extends _ModuleSupport.ToolbarButtonOptions {
    value: AgZoomButtonValue;
}

type ZoomButtonsVisible = 'always' | 'zoomed' | 'hover';

export class ZoomToolbar extends BaseProperties {
    @Property
    @ActionOnSet<ZoomToolbar>({
        changeValue(enabled) {
            this.toolbar?.setHidden(!enabled);
        },
    })
    public enabled: boolean = false;

    @Property
    public buttons = new PropertiesArray(ZoomButtonProperties);

    @Property
    @ActionOnSet<ZoomToolbar>({
        changeValue(visible: ZoomButtonsVisible, oldValue: any) {
            if (oldValue == null) return;
            const always = visible === 'always';
            const zoomed = visible === 'zoomed' && this.previousZoom != null && !isMaxZoom(this.previousZoom);
            this.toggleVisibility(always || zoomed);
        },
    })
    public visible: ZoomButtonsVisible = 'hover';

    @Property
    public anchorPointX?: AgZoomAnchorPoint;

    @Property
    public anchorPointY?: AgZoomAnchorPoint;

    private readonly verticalSpacing = 10;
    private readonly detectionRange = 38;

    private readonly container: _ModuleSupport.NativeWidget<HTMLDivElement>;
    private readonly toolbar: _ModuleSupport.Toolbar<ZoomToolbarButtonOptions>;

    private readonly cleanup = new CleanupRegistry();

    private previousZoom?: DefinedZoomState;

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly getModuleProperties: () => ZoomProperties,
        private readonly updateZoom: (sourcing: _ModuleSupport.UpdateZoomSourcing, zoom: DefinedZoomState) => void,
        private readonly updateAxisZoom: (
            sourcing: _ModuleSupport.UpdateZoomSourcing,
            axisId: AxisID,
            direction: CartesianAxisDirection,
            partialZoom: _ModuleSupport.ZoomState | undefined
        ) => void,
        private readonly resetZoom: (sourceDetail: _ModuleSupport.ZoomEventSourceDetail) => void,
        private readonly isZoomValid: (zoom: DefinedZoomState) => boolean
    ) {
        super();

        this.container = new NativeWidget(createElement('div'));
        this.container.addClass('ag-charts-zoom-buttons');
        ctx.domManager.addChild('canvas-overlay', 'zoom-buttons', this.container.getElement());

        this.toolbar = new Toolbar<ZoomToolbarButtonOptions>(ctx, 'ariaLabelZoomToolbar', 'horizontal');
        this.container.addChild(this.toolbar);

        // Initially translate by an estimated offset to prevent flash on load
        this.toolbar.getElement().style.transform = `translateY(54px)`;
        this.toolbar.setHidden(!this.enabled);

        this.toggleVisibility(this.visible === 'always');

        this.cleanup.register(
            this.toolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this)),
            this.toolbar.addToolbarListener('button-focused', this.onButtonFocus.bind(this)),
            ctx.widgets.containerWidget.addListener('mousemove', this.onHover.bind(this)),
            ctx.widgets.containerWidget.addListener('mouseleave', this.onLeave.bind(this)),
            ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)),
            this.teardown.bind(this)
        );
    }

    public destroy() {
        this.cleanup.flush();
    }

    public toggleVisibleZoomed(maxZoom: boolean) {
        if (this.visible !== 'zoomed') return;
        this.toggleVisibility(!maxZoom);
    }

    private teardown() {
        this.ctx.domManager.removeChild('canvas-overlay', 'zoom-buttons');
        this.container.destroy();
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        if (!this.enabled) return;

        const { buttons, container } = this;
        const { rect } = event.series;

        // CRT-906 Fix the tooltip defaults when using custom zoom toolbars
        for (const b of buttons) {
            if (b.tooltip == null && b.label == null) {
                const map = {
                    'pan-end': 'toolbarZoomPanEnd',
                    'pan-left': 'toolbarZoomPanLeft',
                    'pan-right': 'toolbarZoomPanRight',
                    'pan-start': 'toolbarZoomPanStart',
                    'zoom-in': 'toolbarZoomZoomIn',
                    'zoom-out': 'toolbarZoomZoomOut',
                    reset: 'toolbarZoomReset',
                } as const;
                b.tooltip = map[b.value];
            }
        }
        this.toolbar.updateButtons(buttons);
        this.toggleButtonsDebounced();

        const height = container.getBounds().height;
        container.setBounds({ y: rect.y + rect.height - height });
    }

    private onHover(event: _Widget.MouseWidgetEvent<'mousemove'>) {
        if (!this.enabled || this.visible !== 'hover' || this.toolbar.isHidden()) return;

        const {
            container,
            detectionRange,
            ctx: { scene },
        } = this;
        const {
            currentY,
            sourceEvent: { target },
        } = event;

        const element = container.getElement();
        const detectionY = element.offsetTop - detectionRange;
        const visible = (currentY > detectionY && currentY < scene.canvas.element.offsetHeight) || target === element;

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

    private readonly toggleButtonsDebounced = debounce(this.toggleButtons.bind(this), ZOOM_VALID_CHECK_DEBOUNCE, {
        leading: true,
        trailing: true,
    });
    private toggleButtons() {
        const zoom: Readonly<DefinedZoomState> = definedZoomState(this.ctx.zoomManager.getZoom());

        // Only change the buttons if zoom has changed to prevent churn
        if (this.previousZoom && isZoomEqual(this.previousZoom, zoom)) return;
        this.previousZoom = zoom;

        for (const [index, button] of this.buttons.entries()) {
            let enabled = true;

            switch (button?.value) {
                case 'pan-start':
                    enabled = zoom.x.min > UNIT_MIN;
                    break;
                case 'pan-end':
                    enabled = zoom.x.max < UNIT_MAX;
                    break;
                case 'pan-left':
                    enabled = zoom.x.min > UNIT_MIN;
                    break;
                case 'pan-right':
                    enabled = zoom.x.max < UNIT_MAX;
                    break;
                case 'zoom-out':
                    enabled = !isZoomEqual(zoom, unitZoomState());
                    break;
                case 'zoom-in':
                    enabled = this.isZoomValid(
                        this.getNextZoomStateUnified('zoom-in', zoom, this.getModuleProperties())
                    );
                    break;
                case 'reset':
                    enabled = canResetZoom(this.ctx.zoomManager);
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
            for (const [axisId, value] of entries(axisZooms)) {
                if (value == null) continue;
                const { direction, min, max } = value;
                this.onButtonPressAxis(button, props, axisId, direction, { min, max });
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
        axisId: AxisID,
        direction: CartesianAxisDirection,
        zoom: _ModuleSupport.ZoomState
    ) {
        const { isScalingX, isScalingY, scrollingStep } = props;

        let newZoom = { ...zoom };
        const delta = zoom.max - zoom.min;

        switch (event.value) {
            case 'pan-start':
                newZoom.max = delta;
                newZoom.min = 0;
                break;

            case 'pan-end':
                newZoom.min = newZoom.max - delta;
                newZoom.max = UNIT_MAX;
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
                const placement = isDirectionX ? this.getAnchorPointX(props) : this.getAnchorPointY(props);

                newZoom.max = newZoom.min + (newZoom.max - newZoom.min) * scale;
                newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, placement);
                break;
            }
        }

        this.updateAxisZoom(userInteraction(`zoom-button-${event.value}`), axisId, direction, constrainAxis(newZoom));
    }

    private onButtonPressUnified(event: { value: AgZoomButtonValue }, props: ZoomProperties) {
        const { scrollingStep } = props;

        const oldZoom = definedZoomState(this.ctx.zoomManager.getZoom());
        let zoom = definedZoomState(oldZoom);

        switch (event.value) {
            case 'reset':
                this.resetZoom('zoom-button-reset');
                return;

            case 'pan-start':
                zoom.x.max = dx(zoom);
                zoom.x.min = 0;
                break;

            case 'pan-end':
                zoom.x.min = UNIT_MAX - dx(zoom);
                zoom.x.max = UNIT_MAX;
                break;

            case 'pan-left':
                zoom = translateZoom(zoom, -dx(zoom) * scrollingStep, 0);
                break;

            case 'pan-right':
                zoom = translateZoom(zoom, dx(zoom) * scrollingStep, 0);
                break;

            case 'zoom-in':
            case 'zoom-out': {
                zoom = this.getNextZoomStateUnified(event.value, oldZoom, props);
                break;
            }
        }

        this.updateZoom(userInteraction(`zoom-button-${event.value}`), constrainZoom(zoom));
    }

    private getNextZoomStateUnified(button: 'zoom-in' | 'zoom-out', oldZoom: DefinedZoomState, props: ZoomProperties) {
        const { isScalingX, isScalingY, scrollingStep } = props;

        const scale = button === 'zoom-in' ? 1 - scrollingStep : 1 + scrollingStep;
        const zoom = scaleZoom(oldZoom, isScalingX ? scale : 1, isScalingY ? scale : 1);
        zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, this.getAnchorPointX(props));
        zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, this.getAnchorPointY(props));

        return zoom;
    }

    private getAnchorPointX(props: ZoomProperties) {
        const anchorPointX = this.anchorPointX ?? props.anchorPointX;
        return anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
    }

    private getAnchorPointY(props: ZoomProperties) {
        const anchorPointY = this.anchorPointY ?? props.anchorPointY;
        return anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;
    }
}
