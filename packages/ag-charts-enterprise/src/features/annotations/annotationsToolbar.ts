import { _ModuleSupport, _Widget } from 'ag-charts-community';
import {
    ActionOnSet,
    BaseProperties,
    type BoxBounds,
    ChartAxisDirection,
    CleanupRegistry,
    EventEmitter,
    PropertiesArray,
    Property,
} from 'ag-charts-core';

import type { SharedToolbar, SharedToolbarWithSection } from '../shared-toolbar/sharedToolbar';
import { ToolbarButtonProperties } from '../toolbar/buttonProperties';
import { type AnnotationType } from './annotationTypes';
import {
    FIBONACCI_ANNOTATION_ITEMS,
    LINE_ANNOTATION_ITEMS,
    MEASURER_ANNOTATION_ITEMS,
    SHAPE_ANNOTATION_ITEMS,
    TEXT_ANNOTATION_ITEMS,
} from './annotationsMenuOptions';

const { LayoutElement, Menu } = _ModuleSupport;
interface EventMap {
    'cancel-create-annotation': null;
    'pressed-create-annotation': { annotation: AnnotationType };
    'pressed-clear': null;
    'pressed-show-menu': null;
    'pressed-unrelated': null;
}

interface AnnotationsToolbarButtonOptions extends _ModuleSupport.ToolbarButtonOptions {
    value: AnnotationsToolbarButtonValue;
}

type AnnotationsToolbarButtonValue =
    | 'line-menu'
    | 'fibonacci-menu'
    | 'text-menu'
    | 'shape-menu'
    | 'measurer-menu'
    | 'clear';

class AnnotationsToolbarButtonProperties extends ToolbarButtonProperties {
    @Property
    value!: AnnotationsToolbarButtonValue;
}

export class AnnotationsToolbar extends BaseProperties {
    @Property
    @ActionOnSet<AnnotationsToolbar>({
        changeValue(enabled: boolean) {
            this.toolbar?.setHidden(!enabled);
        },
    })
    public enabled?: boolean = true;

    /**
     * The padding between the toolbar and the chart area.
     */
    @Property
    padding: number = 20;

    private readonly menuMargin: number = 6;

    @Property
    public buttons = new PropertiesArray(AnnotationsToolbarButtonProperties);

    readonly events = new EventEmitter<EventMap>();

    private readonly toolbar: SharedToolbarWithSection<AnnotationsToolbarButtonOptions>;
    private readonly annotationMenu = new Menu(this.ctx, 'annotations');

    private readonly cleanup = new CleanupRegistry();

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.toolbar = ((ctx as any).sharedToolbar as SharedToolbar).getSharedToolbar('annotations');

        const onKeyDown = this.onKeyDown.bind(this);
        this.toolbar.addListener('keydown', onKeyDown);

        this.cleanup.register(
            this.toolbar.addToolbarListener('button-pressed', this.onToolbarButtonPress.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.ToolbarLeft, this.onLayoutStart.bind(this)),
            () => {
                this.toolbar.removeListener('keydown', onKeyDown);
                this.toolbar.destroy();
            }
        );
    }

    public destroy() {
        this.cleanup.flush();
    }

    public toggleClearButtonEnabled(enabled: boolean) {
        const index = this.buttons.findIndex((button) => button.value === 'clear');
        this.toolbar.toggleButtonEnabledByIndex(index, enabled);
    }

    public resetButtonIcons() {
        for (const [index, button] of this.buttons.entries()) {
            switch (button.value) {
                case 'line-menu':
                    this.updateButtonByIndex(index, { icon: 'trend-line-drawing', value: 'line-menu' });
                    break;

                case 'fibonacci-menu':
                    this.updateButtonByIndex(index, { icon: 'fibonacci-retracement-drawing', value: 'fibonacci-menu' });
                    break;

                case 'text-menu':
                    this.updateButtonByIndex(index, { icon: 'text-annotation', value: 'text-menu' });
                    break;

                case 'shape-menu':
                    this.updateButtonByIndex(index, { icon: 'arrow-drawing', value: 'shape-menu' });
                    break;

                case 'measurer-menu':
                    this.updateButtonByIndex(index, { icon: 'measurer-drawing', value: 'measurer-menu' });
                    break;
            }
        }
    }

    public hideOverlays() {
        this.annotationMenu.hide();
    }

    public clearActiveButton() {
        this.toolbar.clearActiveButton();
    }

    private onLayoutStart(ctx: _ModuleSupport.LayoutContext) {
        if (!this.enabled) return;
        this.toolbar.updateButtons(this.buttons);
        this.toolbar.layout(ctx.layoutBox, this.padding);
    }

    public refreshButtonsEnabled(enabled: boolean) {
        for (const [index, button] of this.buttons.entries()) {
            if (!button) continue;
            this.toolbar.toggleButtonEnabledByIndex(index, enabled);
        }
    }

    private onToolbarButtonPress({
        event,
        button,
        buttonBounds,
        buttonWidget,
    }: _ModuleSupport.ToolbarEventMap<AnnotationsToolbarButtonOptions>['button-pressed']) {
        const axisScale = this.ctx.axisManager.getAxisContext(ChartAxisDirection.Y)[0].scale;

        switch (button.value) {
            case 'clear':
                this.events.emit('pressed-clear', null);
                break;

            case 'line-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    buttonWidget,
                    button.value,
                    'toolbarAnnotationsLineAnnotations',
                    LINE_ANNOTATION_ITEMS.filter((item) => (item.visible ? item.visible(axisScale) : true))
                );
                break;

            case 'fibonacci-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    buttonWidget,
                    button.value,
                    'toolbarAnnotationsFibonacciAnnotations',
                    FIBONACCI_ANNOTATION_ITEMS
                );
                break;

            case 'text-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    buttonWidget,
                    button.value,
                    'toolbarAnnotationsTextAnnotations',
                    TEXT_ANNOTATION_ITEMS
                );
                break;

            case 'shape-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    buttonWidget,
                    button.value,
                    'toolbarAnnotationsShapeAnnotations',
                    SHAPE_ANNOTATION_ITEMS
                );
                break;

            case 'measurer-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    buttonWidget,
                    button.value,
                    'toolbarAnnotationsMeasurerAnnotations',
                    MEASURER_ANNOTATION_ITEMS
                );
                break;
        }
    }

    private onToolbarButtonPressShowMenu(
        event: _ModuleSupport.MouseWidgetEvent<'click'>,
        buttonBounds: BoxBounds,
        controller: _Widget.ExpansionControllerWidget,
        menu: AnnotationsToolbarButtonValue,
        ariaLabel: string,
        items: Array<_ModuleSupport.MenuItem<AnnotationType>>
    ) {
        this.events.emit('pressed-show-menu', null);

        const index = this.buttons.findIndex((button) => button.value === menu);
        this.toolbar.toggleActiveButtonByIndex(index);

        const anchorX = this.ctx.domManager.isRtl
            ? buttonBounds.x - this.menuMargin
            : buttonBounds.x + buttonBounds.width + this.menuMargin;

        this.annotationMenu.setAnchor({ x: anchorX, y: buttonBounds.y });
        this.annotationMenu.show<AnnotationType>(controller, {
            items,
            ariaLabel: this.ctx.localeManager.t(ariaLabel),
            class: 'ag-charts-annotations__toolbar-menu',
            sourceEvent: event.sourceEvent,
            onPress: this.onButtonPressMenuCreateAnnotation.bind(this, menu),
        });
    }

    private onButtonPressMenuCreateAnnotation(
        menu: AnnotationsToolbarButtonValue,
        item: _ModuleSupport.MenuItem<AnnotationType>
    ) {
        const index = this.buttons.findIndex((button) => button.value === menu);
        this.updateButtonByIndex(index, { icon: item.icon });
        this.events.emit('pressed-create-annotation', { annotation: item.value });
        this.annotationMenu.hide();
    }

    private onKeyDown({ sourceEvent }: _ModuleSupport.KeyboardWidgetEvent) {
        if (sourceEvent.key === 'Escape') {
            this.events.emit('cancel-create-annotation', null);
        }
    }

    private updateButtonByIndex(index: number, change: Partial<AnnotationsToolbarButtonOptions>) {
        const button = this.buttons.at(index);
        if (!button) return;
        button.set({ ...button.toJson(), ...change, value: change.value ?? button.value });
        this.toolbar.updateButtonByIndex(index, { ...button.toJson() } as any);
    }
}
