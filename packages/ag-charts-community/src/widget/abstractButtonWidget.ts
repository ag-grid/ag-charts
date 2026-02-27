import { isButtonClickEvent, setAttribute } from 'ag-charts-core';

import type { ExpandOpts, ExpandableWidget, ExpansionControllerWidget } from './expandableWidget';
import { ExpansionControllerImpl } from './expansionControllerImpl';
import { Widget } from './widget';
import type {
    WidgetEventMap as EventMap,
    KeyboardSyntheticMouseWidgetEvent,
    KeyboardWidgetEvent,
} from './widgetEvents';

type R = ReturnType<Widget['addListener']>;

export class AbstractButtonWidget<TElement extends HTMLElement>
    extends Widget<TElement>
    implements ExpansionControllerWidget<TElement>
{
    private controllerImpl?: ExpansionControllerImpl<TElement>;
    private lazyControllerImpl(): ExpansionControllerImpl<TElement> {
        this.controllerImpl ??= new ExpansionControllerImpl<TElement>(this, () => this.internalListener);
        return this.controllerImpl;
    }

    constructor(element: TElement, role?: 'menuitem' | 'menuitemradio') {
        super(element);
        setAttribute(this.elem, 'role', role);
        this.setEnabled(true);
        this.addListener('keydown', ({ sourceEvent }: KeyboardWidgetEvent) => {
            if (isButtonClickEvent(sourceEvent)) {
                sourceEvent.preventDefault();
                const widgetEvent: KeyboardSyntheticMouseWidgetEvent<'click'> = this.allocEvent({
                    type: 'click',
                    device: 'keyboard',
                    sourceEvent,
                });

                this.htmlListener?.dispatch('click', this, widgetEvent);
            }
        });
    }

    protected override destructor() {
        this.controllerImpl?.destroy();
    }

    setEnabled(enabled: boolean) {
        setAttribute(this.elem, 'aria-disabled', !enabled);
    }

    setControlled(controls: ExpandableWidget<TElement> | undefined): void {
        return this.lazyControllerImpl().setControlled(controls);
    }

    getControlled(): ExpandableWidget<TElement> | undefined {
        return this.lazyControllerImpl().getControlled();
    }

    expandControlled(opts?: ExpandOpts): void {
        return this.lazyControllerImpl().expandControlled(opts);
    }

    override addListener<K extends keyof EventMap>(type: K, listener: (ev: EventMap[K], current: this) => unknown): R;
    override addListener<K extends keyof EventMap>(type: K, listener: (ev: unknown, current: this) => unknown): R {
        return super.addListener(type, (ev, current: this) => {
            if ((type === 'click' || type === 'dblclick') && this.isDisabled()) return;
            listener(ev, current);
        });
    }
}
