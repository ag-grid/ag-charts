import type { RequireOptional } from 'ag-charts-core';

import { CollapseMode } from './collapseMode';
import type {
    CollapseWidgetEvent,
    ExpandControlledOpts,
    ExpandControlledWidgetEvent,
    ExpandableWidget,
    ExpansionControllerWidget,
} from './expandableWidget';
import type { Widget } from './widget';

interface Dispatcher {
    dispatch(type: 'expand-controlled-widget', current: Widget, event: ExpandControlledWidgetEvent): void;
}

export class ExpansionControllerImpl<TElement extends HTMLElement> implements ExpansionControllerWidget<TElement> {
    private readonly controller: Widget & ExpansionControllerWidget<TElement>;
    private controls?: ExpandableWidget<TElement>;

    private readonly onExpanded = () => {
        this.controller.setAriaExpanded(true);
        const dispatcher = this.getDispatcher();
        if (dispatcher && this.controls) {
            const event: ExpandControlledWidgetEvent = {
                type: 'expand-controlled-widget',
                controlled: this.controls,
            };
            dispatcher.dispatch('expand-controlled-widget', this.controller, event);
        }
    };

    private readonly onCollapsed = (e: CollapseWidgetEvent) => {
        this.controller.setAriaExpanded(false);
        if (e.mode === CollapseMode.CLOSE) {
            this.controller.focus();
        }
    };

    constructor(
        controller: Widget & ExpansionControllerWidget<TElement>,
        private readonly getDispatcher: () => Dispatcher | undefined
    ) {
        controller.setAriaExpanded(false);
        this.controller = controller;
    }

    destroy(): void {
        this.controls?.collapse({ mode: CollapseMode.DESTROY });
        this.setControlled(undefined);
    }

    setControlled(controls: ExpandableWidget<TElement> | undefined): void {
        if (this.controls) {
            this.controls.removeListener('expand-widget', this.onExpanded);
            this.controls.removeListener('collapse-widget', this.onCollapsed);
        }
        this.controls = controls;
        if (this.controls) {
            this.controller.setAriaControls(this.controls.id);
            this.controls.addListener('expand-widget', this.onExpanded);
            this.controls.addListener('collapse-widget', this.onCollapsed);
        }
    }

    getControlled(): ExpandableWidget<TElement> | undefined {
        return this.controls;
    }

    expandControlled(opts?: ExpandControlledOpts): void {
        // Disabled buttons are focusable and can receive events, but have aria-disabled="true"
        if (!this.controller.isDisabled()) {
            // Check that all options in ExpandControlledOpts are copied over to ExpandOpts
            type AllDefined = RequireOptional<Parameters<NonNullable<typeof this.controls>['expand']>[0]>;
            this.controls?.expand({
                controller: this.controller,
                sourceEvent: undefined,
                overrideFocusVisible: opts?.overrideFocusVisible,
            } satisfies AllDefined);
        }
    }
}
