import type { LayoutRegisterElementOptions } from '../../chart/layout/layoutManager';
import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { ElementProvider } from '../componentTypes';

export interface WidgetConstructorOptions {
    layout: LayoutRegisterElementOptions;
}

export interface WidgetOptions {}

const CANVAS_OVERLAY = 'canvas-overlay';

/**
 * A component that is immediately attached to the dom and takes space from the layout.
 */
export abstract class Widget<Options extends WidgetOptions = WidgetOptions>
    extends BaseModuleInstance
    implements ModuleInstance, ElementProvider
{
    private readonly element: HTMLElement;
    private readonly moduleId: string;

    constructor(
        protected readonly ctx: ModuleContext,
        id: string,
        options: WidgetConstructorOptions
    ) {
        super();

        this.moduleId = `widget-${id}`;

        this.element = ctx.domManager.addChild(CANVAS_OVERLAY, this.moduleId);
        this.element.setAttribute('role', 'presentation');

        this.destroyFns.push(
            () => ctx.domManager.removeChild(CANVAS_OVERLAY, this.moduleId),
            ctx.layoutManager.NEW_registerElement(options.layout, this.onLayoutElement.bind(this)),
            ctx.domHierarchyManager.attach(this)
        );
    }

    getElement() {
        return this.element;
    }

    getElementId() {
        return this.moduleId;
    }

    protected createWithChildren(children: Array<HTMLElement>, _options: Options) {
        this.element.append(...children);

        return this.element;
    }

    protected onLayoutElement(event: { x: number; y: number }) {
        this.element.style.setProperty('top', `${event.x}px`);
        this.element.style.setProperty('left', `${event.y}px`);
        this.element.style.setProperty('right', 'unset');
        this.element.style.setProperty('bottom', 'unset');
    }
}
