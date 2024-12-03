import { _ModuleSupport } from 'ag-charts-community';

import type { SharedToolbar, SharedToolbarWithSection } from '../shared-toolbar/sharedToolbar';
import { type AnnotationType } from './annotationTypes';
import {
    FIBONACCI_ANNOTATION_ITEMS,
    LINE_ANNOTATION_ITEMS,
    MEASURER_ANNOTATION_ITEMS,
    SHAPE_ANNOTATION_ITEMS,
    TEXT_ANNOTATION_ITEMS,
} from './annotationsMenuOptions';

const { ARRAY, BOOLEAN, UNION, ActionOnSet, LayoutElement, Menu, PropertiesArray, ToolbarButtonProperties, Validate } =
    _ModuleSupport;

interface EventMap {
    'cancel-create-annotation': void;
    'pressed-create-annotation': { annotation: AnnotationType };
    'pressed-clear': void;
    'pressed-show-menu': void;
    'pressed-unrelated': void;
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
    @Validate(UNION(['line-menu', 'fibonacci-menu', 'text-menu', 'shape-menu', 'measurer-menu', 'clear']))
    value!: AnnotationsToolbarButtonValue;
}

export class AnnotationsToolbar extends _ModuleSupport.BaseProperties {
    @Validate(BOOLEAN)
    @ActionOnSet<AnnotationsToolbar>({
        changeValue(enabled) {
            this.toolbar?.setHidden(!enabled);
        },
    })
    public enabled?: boolean = true;

    @Validate(ARRAY)
    public buttons = new PropertiesArray(AnnotationsToolbarButtonProperties);

    private readonly events = new _ModuleSupport.Listeners<keyof EventMap, any>();

    private readonly toolbar: SharedToolbarWithSection<AnnotationsToolbarButtonOptions>;
    private readonly annotationMenu = new Menu(this.ctx, 'annotations');

    private readonly destroyFns: (() => void)[] = [];

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.toolbar = ((ctx as any).sharedToolbar as SharedToolbar).getSharedToolbar('annotations');

        const onKeyDown = this.onKeyDown.bind(this);
        this.toolbar.addListener('keydown', onKeyDown);

        this.destroyFns.push(
            this.toolbar.addToolbarListener('button-pressed', this.onToolbarButtonPress.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.ToolbarLeft, this.onLayoutStart.bind(this)),
            () => {
                this.toolbar.removeListener('keydown', onKeyDown);
                this.toolbar.destroy();
            }
        );
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
                    this.updateButtonByIndex(index, { icon: 'trend-line-drawing', value: 'line-menu' });
                    break;

                case 'fibonacci-menu':
                    this.updateButtonByIndex(index, { icon: 'fibonacci-drawing', value: 'fibonacci-menu' });
                    break;

                case 'text-menu':
                    this.updateButtonByIndex(index, { icon: 'text-annotation', value: 'text-menu' });
                    break;

                case 'shape-menu':
                    this.updateButtonByIndex(index, { icon: 'arrow-drawing', value: 'shape-menu' });
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

    private dispatch<K extends keyof EventMap>(eventType: K, event?: EventMap[K]) {
        this.events.dispatch(eventType, event);
    }

    private onLayoutStart(event: _ModuleSupport.LayoutContext) {
        if (!this.enabled) return;
        this.toolbar.updateButtons(this.buttons);
        this.toolbar.layout(event.layoutBox);
    }

    private onToolbarButtonPress({
        event,
        button,
        buttonBounds,
    }: _ModuleSupport.ToolbarEventMap<AnnotationsToolbarButtonOptions>['button-pressed']) {
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

            case 'fibonacci-menu':
                this.onToolbarButtonPressShowMenu(
                    event,
                    buttonBounds,
                    button.value,
                    'toolbarAnnotationsFibonacciAnnotations',
                    FIBONACCI_ANNOTATION_ITEMS
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
        this.updateButtonByIndex(index, { icon: item.icon });
        this.dispatch('pressed-create-annotation', { annotation: item.value });
        this.annotationMenu.hide();
    }

    private onKeyDown({ sourceEvent }: _ModuleSupport.KeyboardWidgetEvent) {
        if (sourceEvent.key === 'Escape') {
            this.dispatch('cancel-create-annotation');
        }
    }

    private updateButtonByIndex(index: number, change: Partial<AnnotationsToolbarButtonOptions>) {
        const button = this.buttons.at(index);
        if (!button) return;
        button.set({ ...button.toJson(), ...change, value: change.value ?? button.value });
        this.toolbar.updateButtonByIndex(index, { ...button.toJson() } as any);
    }
}
