import { type BaseStyleTypeMap, CleanupRegistry, type ElementID, createElement, setElementStyle } from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import type { EventsHub } from '../core/eventsHub';
import type { LocaleManager } from '../locale/localeManager';
import { BoundedTextWidget } from '../widget/boundedTextWidget';
import { ButtonWidget } from '../widget/buttonWidget';
import { GroupWidget } from '../widget/groupWidget';
import { ListWidget } from '../widget/listWidget';
import { NativeWidget } from '../widget/nativeWidget';
import { SliderWidget } from '../widget/sliderWidget';
import { SwitchWidget } from '../widget/switchWidget';
import { ToolbarWidget } from '../widget/toolbarWidget';
import type { Widget } from '../widget/widget';
import type { DOMManager } from './domManager';

type ParentProperties<T = NativeWidget<HTMLDivElement>> =
    | { readonly parent: T }
    | { readonly domManagerId: string; readonly where: 'beforebegin' | 'afterend' };

type ElemParams<T extends ProxyElementType> = {
    readonly type: T;
    readonly cursor?: BaseStyleTypeMap['cursor'];
};

type InteractParams<T extends ProxyElementType> = ElemParams<T> & {
    readonly tabIndex?: number;
    readonly domIndex?: number;
};

type TranslationKey = { id: string; params?: Record<string, any> };

type ContainerParams<T extends ProxyContainerType> = {
    readonly type: T;
    readonly domManagerId: string;
    readonly classList: string[];
    readonly ariaLabel: TranslationKey;
};

type ProxyMeta = {
    // Elements
    button: {
        params: ParentProperties<GroupWidget> &
            InteractParams<'button'> & {
                readonly textContent: string | TranslationKey;
            };
        result: ButtonWidget;
    };
    slider: {
        params: ParentProperties<ToolbarWidget | GroupWidget> &
            InteractParams<'slider'> & { readonly ariaLabel: TranslationKey; readonly role?: string };
        result: SliderWidget;
    };
    text: {
        params: ParentProperties & ElemParams<'text'>;
        result: BoundedTextWidget;
    };
    listswitch: {
        params: ParentProperties<ListWidget> &
            InteractParams<'listswitch'> & {
                readonly textContent: string;
                readonly ariaChecked: boolean;
                readonly ariaDescribedBy: ElementID;
            };
        result: SwitchWidget;
    };
    region: {
        params: ParentProperties & ElemParams<'region'>;
        result: NativeWidget<HTMLDivElement>;
    };

    // Containers
    toolbar: {
        params: ContainerParams<'toolbar'> & { readonly orientation: Direction };
        result: ToolbarWidget;
    };
    group: {
        params: ContainerParams<'group'>;
        result: GroupWidget;
    };
    list: {
        params: ContainerParams<'list'>;
        result: ListWidget;
    };
};

type ProxyElementType = 'button' | 'slider' | 'text' | 'listswitch' | 'region';
type ProxyContainerType = 'toolbar' | 'group' | 'list';

function checkType<T extends keyof ProxyMeta>(type: T, meta: ProxyMeta[keyof ProxyMeta]): meta is ProxyMeta[T] {
    return meta.params?.type === type;
}

function allocateResult<T extends keyof ProxyMeta>(type: T): ProxyMeta[T]['result'] {
    if ('button' === type) {
        return new ButtonWidget();
    } else if ('slider' === type) {
        return new SliderWidget();
    } else if ('toolbar' === type) {
        return new ToolbarWidget();
    } else if ('group' === type) {
        return new GroupWidget();
    } else if ('list' === type) {
        return new ListWidget();
    } else if ('region' === type) {
        return new NativeWidget<HTMLDivElement>(createElement('div'));
    } else if ('text' === type) {
        return new BoundedTextWidget();
    } else if ('listswitch' === type) {
        return new SwitchWidget();
    } else {
        throw new Error('AG Charts - error allocating meta');
    }
}

function allocateMeta<T extends keyof ProxyMeta>(params: ProxyMeta[T]['params']): ProxyMeta[T] {
    const meta = { params, result: undefined } as unknown as ProxyMeta[T];
    meta.result = allocateResult(meta.params.type);
    return meta;
}

export class ProxyInteractionService {
    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly localeManager: LocaleManager,
        private readonly domManager: DOMManager
    ) {}

    destroy() {
        this.cleanup.flush();
    }

    private addLocalisation(fn: () => void) {
        fn();
        // FIXME(olegat) The result of `addListener` must be freed when the HTMLElement goes out of scope.
        this.cleanup.register(this.eventsHub.on('locale:change', fn));
    }

    createProxyContainer<T extends ProxyContainerType>(
        args: { type: T } & ProxyMeta[T]['params']
    ): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = allocateMeta(args);
        const { params, result } = meta;
        const div = result.getElement();

        this.domManager.addChild('canvas-proxy', params.domManagerId, div);
        div.classList.add(...params.classList, 'ag-charts-proxy-container');
        div.role = params.type;

        if (checkType('toolbar', meta)) {
            meta.result.orientation = meta.params.orientation;
        }

        this.addLocalisation(() => {
            div.ariaLabel = this.localeManager.t(params.ariaLabel.id, params.ariaLabel.params);
        });

        return result;
    }

    createProxyElement<T extends ProxyElementType>(args: { type: T } & ProxyMeta[T]['params']): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = allocateMeta(args);

        if (checkType('button', meta)) {
            const { params, result } = meta;
            const button = result.getElement();
            this.initInteract(params, result);

            if (typeof params.textContent === 'string') {
                button.textContent = params.textContent;
            } else {
                const { textContent } = params;
                this.addLocalisation(() => {
                    button.textContent = this.localeManager.t(textContent.id, textContent.params);
                });
            }
            this.setParent(meta.params, meta.result);
        }

        if (checkType('slider', meta)) {
            const { params, result } = meta;
            const slider = result.getElement();
            this.initInteract(params, result);
            slider.type = 'range';
            slider.role = params.role ?? 'presentation';
            slider.style.margin = '0px';
            this.addLocalisation(() => {
                slider.ariaLabel = this.localeManager.t(params.ariaLabel.id, params.ariaLabel.params);
            });
            this.setParent(meta.params, meta.result);
        }

        if (checkType('text', meta)) {
            const { params, result } = meta;
            this.initElement(params, result);
            this.setParent(meta.params, meta.result);
        }

        if (checkType('listswitch', meta)) {
            const { params, result: button } = meta;
            this.initInteract(params, button);
            button.setTextContent(params.textContent);
            button.setChecked(params.ariaChecked);
            button.setAriaDescribedBy(params.ariaDescribedBy);
            this.setParent(meta.params, meta.result);
        }

        if (checkType('region', meta)) {
            const { params, result } = meta;
            const region = result.getElement();
            this.initInteract(params, result);
            region.role = 'region';
            this.setParent(meta.params, meta.result);
        }

        return meta.result;
    }

    private initElement<T extends ProxyElementType>(params: ElemParams<T>, widget: Widget) {
        const element = widget.getElement();
        setElementStyle(element, 'cursor', params.cursor);
        element.classList.toggle('ag-charts-proxy-elem', true);
        return element;
    }

    private initInteract<T extends ProxyElementType>(params: InteractParams<T>, widget: Widget) {
        const { tabIndex, domIndex } = params;
        const element = this.initElement(params, widget);

        if (tabIndex !== undefined) {
            element.tabIndex = tabIndex;
        }
        if (domIndex !== undefined) {
            widget.domIndex = domIndex;
        }
    }

    private setParent<TParent extends Widget, TChild extends Widget>(
        params: ParentProperties<TParent>,
        element: TChild
    ) {
        if ('parent' in params) {
            params.parent?.addChild(element);
        } else {
            const insert = { where: params.where, query: '.ag-charts-series-area' };
            this.domManager.addChild('canvas-proxy', params.domManagerId, element.getElement(), insert);
            element.destroyListener = () => {
                this.domManager.removeChild('canvas-proxy', params.domManagerId);
            };
        }
    }
}
