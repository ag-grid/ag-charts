import { type AgToolbarAnnotationsButtonValue, _ModuleSupport, _Util } from 'ag-charts-community';

import { Menu, type MenuItem } from '../../components/menu/menu';
import {
    ANNOTATION_BUTTONS,
    ANNOTATION_BUTTON_GROUPS,
    type AnnotationType,
    stringToAnnotationType,
} from './annotationTypes';
import {
    LINE_ANNOTATION_ITEMS,
    MEASURER_ANNOTATION_ITEMS,
    SHAPE_ANNOTATION_ITEMS,
    TEXT_ANNOTATION_ITEMS,
} from './annotationsMenuOptions';

const { ToolbarManager } = _ModuleSupport;

interface EventMap {
    'cancel-create-annotation': void;
    'pressed-create-annotation': { annotation: AnnotationType };
    'pressed-clear': void;
    'pressed-show-menu': void;
    'pressed-unrelated': void;
}

export class AnnotationsToolbar extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly events = new _ModuleSupport.Listeners<keyof EventMap, any>();

    private readonly annotationMenu = new Menu(this.ctx, 'annotations');

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const { toolbarManager } = ctx;

        this.destroyFns.push(
            toolbarManager.addListener('button-pressed', this.onButtonPress.bind(this)),
            toolbarManager.addListener('cancelled', this.onCancelled.bind(this))
        );
    }

    public addListener<K extends keyof EventMap>(eventType: K, handler: (event: EventMap[K]) => void) {
        return this.events.addListener(eventType, handler);
    }

    public toggleVisibility(visible: boolean) {
        this.ctx.toolbarManager.toggleGroup('annotations', 'annotations', { visible });
    }

    public toggleClearButtonEnabled(enabled: boolean) {
        this.ctx.toolbarManager.toggleButton('annotations', 'clear', { enabled });
    }

    public resetButtonIcons() {
        this.ctx.toolbarManager.updateButton('annotations', 'line-menu', { icon: undefined });
        this.ctx.toolbarManager.updateButton('annotations', 'text-menu', { icon: undefined });
        this.ctx.toolbarManager.updateButton('annotations', 'shape-menu', { icon: undefined });
    }

    public hideOverlays() {
        this.annotationMenu.hide();
    }

    public resetButtonStates() {
        const {
            ctx: { toolbarManager },
        } = this;

        // Reset buttons that are _not_ part of a menu
        for (const annotationType of ANNOTATION_BUTTONS) {
            toolbarManager.toggleButton('annotations', annotationType, { active: false });
        }

        // Reset buttons that open a menu
        for (const annotationGroup of ANNOTATION_BUTTON_GROUPS) {
            toolbarManager.toggleButton('annotations', annotationGroup, { active: false });
        }
    }

    private dispatch<K extends keyof EventMap>(eventType: K, event?: EventMap[K]) {
        this.events.dispatch(eventType, event);
    }

    private onButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        if (!ToolbarManager.isGroup('annotations', event)) {
            if (!ToolbarManager.isGroup('annotationOptions', event)) {
                this.dispatch('pressed-unrelated');
            }
            return;
        }

        if (event.value === 'clear') {
            this.dispatch('pressed-clear');
            return;
        }

        if (event.value === 'line-menu') {
            this.onButtonPressShowMenu(event, 'toolbarAnnotationsLineAnnotations', LINE_ANNOTATION_ITEMS);
            return;
        }

        if (event.value === 'text-menu') {
            this.onButtonPressShowMenu(event, 'toolbarAnnotationsTextAnnotations', TEXT_ANNOTATION_ITEMS);
            return;
        }

        if (event.value === 'shape-menu') {
            this.onButtonPressShowMenu(event, 'toolbarAnnotationsShapeAnnotations', SHAPE_ANNOTATION_ITEMS);
            return;
        }

        if (event.value === 'measurer-menu') {
            this.onButtonPressShowMenu(event, 'toolbarAnnotationsMeasurerAnnotations', MEASURER_ANNOTATION_ITEMS);
            return;
        }

        this.onButtonPressCreateAnnotation(event);
    }

    private onButtonPressShowMenu(
        event: _ModuleSupport.ToolbarButtonPressedEvent,
        ariaLabel: string,
        items: Array<MenuItem<AnnotationType>>
    ) {
        const { x, y, width } = event.rect;

        this.dispatch('pressed-show-menu');

        this.annotationMenu.setAnchor({ x: x + width + 6, y });
        this.annotationMenu.show<AnnotationType>({
            items,
            ariaLabel: this.ctx.localeManager.t(ariaLabel),
            sourceEvent: event.sourceEvent,
            onPress: this.onButtonPressMenuCreateAnnotation.bind(this, event),
        });
    }

    private onButtonPressCreateAnnotation(event: _ModuleSupport.ToolbarButtonPressedEvent) {
        this.ctx.tooltipManager.suppressTooltip('annotations');

        const annotation = stringToAnnotationType(event.value);
        if (annotation) {
            this.dispatch('pressed-create-annotation', { annotation });
        } else {
            _Util.Logger.errorOnce(`Can not create unknown annotation type [${event.value}], ignoring.`);
        }
    }

    private onButtonPressMenuCreateAnnotation(
        event: _ModuleSupport.ToolbarButtonPressedEvent<AgToolbarAnnotationsButtonValue>,
        item: MenuItem<AnnotationType>
    ) {
        const { toolbarManager } = this.ctx;

        toolbarManager.toggleButton('annotations', event.id, {
            active: true,
        });
        toolbarManager.updateButton('annotations', event.id, {
            icon: item.icon,
        });

        this.dispatch('pressed-create-annotation', { annotation: item.value });
        this.annotationMenu.hide();
    }

    private onCancelled(event: _ModuleSupport.ToolbarCancelledEvent) {
        if (event.group === 'annotations') {
            this.dispatch('cancel-create-annotation');
        }
    }
}
