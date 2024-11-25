import { _ModuleSupport } from 'ag-charts-community';

import { type AnnotationType } from './annotationTypes';
import {
    LINE_ANNOTATION_ITEMS,
    MEASURER_ANNOTATION_ITEMS,
    SHAPE_ANNOTATION_ITEMS,
    TEXT_ANNOTATION_ITEMS,
} from './annotationsMenuOptions';

const { ARRAY, BOOLEAN, UNION, LayoutElement, Menu, PropertiesArray, Toolbar, ToolbarButtonProperties, Validate } =
    _ModuleSupport;

interface EventMap {
    'cancel-create-annotation': void;
    'pressed-create-annotation': { annotation: AnnotationType };
    'pressed-clear': void;
    'pressed-show-menu': void;
    'pressed-unrelated': void;
}

type AnnotationsToolbarButtonValue = 'line-menu' | 'text-menu' | 'shape-menu' | 'measurer-menu' | 'clear';

class AnnotationsToolbarButtonProperties extends ToolbarButtonProperties {
    @Validate(UNION(['line-menu', 'text-menu', 'shape-menu', 'measurer-menu', 'clear']))
    value!: AnnotationsToolbarButtonValue;
}

export class AnnotationsToolbar extends _ModuleSupport.BaseProperties {
    @Validate(BOOLEAN)
    public enabled?: boolean = true;

    @Validate(ARRAY)
    public buttons = new PropertiesArray(AnnotationsToolbarButtonProperties);

    private readonly events = new _ModuleSupport.Listeners<keyof EventMap, any>();

    private readonly toolbar = new Toolbar<
        _ModuleSupport.ToolbarButtonOptions & { value: AnnotationsToolbarButtonValue }
    >(this.ctx, this.onToolbarButtonPress.bind(this));
    private readonly annotationMenu = new Menu(this.ctx, 'annotations');

    private readonly destroyFns: (() => void)[] = [];

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.toolbar.addClass('ag-charts-annotations__toolbar');
        this.toolbar.orientation = 'vertical';
        ctx.domManager.addChild('canvas-overlay', 'annotations-toolbar', this.toolbar.getElement());

        this.destroyFns.push(ctx.layoutManager.registerElement(LayoutElement.Toolbar, this.onLayoutStart.bind(this)));
    }

    public destroy() {
        for (const destroyFn of this.destroyFns) {
            destroyFn();
        }
    }

    public addListener<K extends keyof EventMap>(eventType: K, handler: (event: EventMap[K]) => void) {
        return this.events.addListener(eventType, handler);
    }

    public toggleVisibility(visible: boolean) {
        this.toolbar.setHidden(!visible);
    }

    public toggleClearButtonEnabled(enabled: boolean) {
        const index = this.buttons.findIndex((button) => button.value === 'clear');
        this.toolbar.toggleButtonEnabledByIndex(index, enabled);
    }

    public resetButtonIcons() {
        for (const [index, button] of this.buttons.entries()) {
            switch (button.value) {
                case 'line-menu':
                    this.toolbar.updateButtonByIndex(index, { icon: 'trend-line-drawing', value: 'line-menu' });
                    break;

                case 'text-menu':
                    this.toolbar.updateButtonByIndex(index, { icon: 'text-annotation', value: 'text-menu' });
                    break;

                case 'shape-menu':
                    this.toolbar.updateButtonByIndex(index, { icon: 'arrow-drawing', value: 'shape-menu' });
                    break;
            }
        }
    }

    public hideOverlays() {
        this.toolbar.clearActiveButton();
        this.annotationMenu.hide();
    }

    public resetButtonStates() {
        this.toolbar.clearActiveButton();
    }

    private dispatch<K extends keyof EventMap>(eventType: K, event?: EventMap[K]) {
        this.events.dispatch(eventType, event);
    }

    private onLayoutStart(event: _ModuleSupport.LayoutContext) {
        const { buttons, toolbar } = this;
        const { layoutBox } = event;

        this.toolbar.updateButtons(buttons);

        const width = toolbar.getBounds().width;
        toolbar.setBounds({
            x: layoutBox.x,
            y: layoutBox.y + 34 + 8,
            width: width,
        });

        // We do not call event.layoutBox.shrink() here as the AnnotationsToolbar is placed inline below the
        // ChartToolbar, which has already shrunk the layout box.
    }

    private onToolbarButtonPress(
        event: _ModuleSupport.MouseWidgetEvent<'click'>,
        button: { index: number; value: AnnotationsToolbarButtonValue },
        buttonBounds: _ModuleSupport.BBoxValues
    ) {
        switch (button.value) {
            case 'clear':
                this.dispatch('pressed-clear');
                break;

            case 'line-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    button.value,
                    'toolbarAnnotationsLineAnnotations',
                    LINE_ANNOTATION_ITEMS
                );
                break;

            case 'text-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    button.value,
                    'toolbarAnnotationsTextAnnotations',
                    TEXT_ANNOTATION_ITEMS
                );
                break;

            case 'shape-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    button.value,
                    'toolbarAnnotationsShapeAnnotations',
                    SHAPE_ANNOTATION_ITEMS
                );
                break;

            case 'measurer-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    button.value,
                    'toolbarAnnotationsMeasurerAnnotations',
                    MEASURER_ANNOTATION_ITEMS
                );
                break;
        }
    }

    private onToolbarButtonPressShowMenu(
        event: _ModuleSupport.MouseWidgetEvent<'click'>,
        buttonBounds: _ModuleSupport.BBoxValues,
        menu: AnnotationsToolbarButtonValue,
        ariaLabel: string,
        items: Array<_ModuleSupport.MenuItem<AnnotationType>>
    ) {
        this.dispatch('pressed-show-menu');

        const index = this.buttons.findIndex((button) => button.value === menu);
        this.toolbar.toggleActiveButtonByIndex(index);
        this.annotationMenu.setAnchor({ x: buttonBounds.x + buttonBounds.width + 6, y: buttonBounds.y });
        this.annotationMenu.show<AnnotationType>({
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
        const button = this.buttons.at(index)!;

        this.toolbar.updateButtonByIndex(index, { ...button, icon: item.icon });

        this.dispatch('pressed-create-annotation', { annotation: item.value });
        this.annotationMenu.hide();
    }

    // TODO: handle esc key
    // private onCancelled(event: any) {
    //     if (event.group === 'annotations') {
    //         this.dispatch('cancel-create-annotation');
    //     }
    // }
}
