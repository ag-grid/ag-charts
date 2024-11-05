import type { Direction } from 'ag-charts-types';

import type { LocaleManager } from '../locale/localeManager';
import { type BaseStyleTypeMap, setAttribute, setElementStyle } from '../util/attributeUtil';
import { createElement, getWindow } from '../util/dom';
import { BoundedText } from './boundedText';
import type { DOMManager } from './domManager';

export type ListSwitch = { button: HTMLButtonElement; listitem: HTMLElement };

type ElemParams<T extends ProxyElementType> = {
    readonly type: T;
    readonly id?: string;
    readonly cursor?: BaseStyleTypeMap['cursor'];
} & ({ readonly parent: HTMLElement } | { readonly domManagerId: string; readonly parent: 'beforebegin' | 'afterend' });

type InteractParams<T extends ProxyElementType> = ElemParams<T> & {
    readonly tabIndex?: number;
    readonly onclick?: (ev: MouseEvent) => void;
    readonly ondblclick?: (ev: MouseEvent) => void;
    readonly onmouseenter?: (ev: MouseEvent) => void;
    readonly onmouseleave?: (ev: MouseEvent) => void;
    readonly oncontextmenu?: (ev: MouseEvent) => void;
    readonly onchange?: (ev: Event) => void;
    readonly onfocus?: (ev: FocusEvent) => void;
    readonly onblur?: (ev: FocusEvent) => void;
};

type TranslationKey = { id: string; params?: Record<string, any> };

type ContainerParams<T extends ProxyContainerType> = {
    readonly type: T;
    readonly domManagerId: string;
    readonly classList: string[];
    readonly ariaLabel: TranslationKey;
    readonly ariaOrientation: Direction;
    readonly ariaHidden?: boolean;
};

type ProxyMeta = {
    // Elements
    button: {
        params: InteractParams<'button'> & { readonly textContent: string | TranslationKey };
        result: HTMLButtonElement;
    };
    slider: {
        params: InteractParams<'slider'> & { readonly ariaLabel: TranslationKey; readonly ariaOrientation: Direction };
        result: HTMLInputElement;
    };
    text: {
        params: ElemParams<'text'>;
        result: BoundedText;
    };
    listswitch: {
        params: InteractParams<'listswitch'> & {
            readonly textContent: string;
            readonly ariaChecked: boolean;
            readonly ariaDescribedBy: string;
        };
        result: ListSwitch;
    };
    region: {
        params: ElemParams<'region'>;
        result: HTMLDivElement;
    };

    // Containers
    toolbar: {
        params: ContainerParams<'toolbar'>;
        result: HTMLDivElement;
    };
    group: {
        params: ContainerParams<'group'>;
        result: HTMLDivElement;
    };
    list: {
        params: Omit<ContainerParams<'list'>, 'ariaOrientation'>;
        result: HTMLDivElement;
    };
};

type ProxyElementType = 'button' | 'slider' | 'text' | 'listswitch' | 'region';
type ProxyContainerType = 'toolbar' | 'group' | 'list';

export type ProxyDragHandlerEvent = {
    offsetX: number;
    offsetY: number;
    // `originDelta` is the offset relative to position of the HTML element when the drag initiated.
    // This is helpful for elements that move during drag actions, like navigator sliders.
    originDeltaX: number;
    originDeltaY: number;
};
type ProxyDragHandler = (event: ProxyDragHandlerEvent) => void;

function checkType<T extends keyof ProxyMeta>(type: T, meta: ProxyMeta[keyof ProxyMeta]): meta is ProxyMeta[T] {
    return meta.params?.type === type;
}

function allocateResult<T extends keyof ProxyMeta>(type: T): ProxyMeta[T]['result'] {
    if ('button' === type) {
        return createElement('button');
    } else if ('slider' === type) {
        return createElement('input');
    } else if (['toolbar', 'group', 'list', 'region'].includes(type)) {
        return createElement('div');
    } else if ('text' === type) {
        return new BoundedText();
    } else if ('listswitch' === type) {
        return { button: createElement('button'), listitem: createElement('div') };
    } else {
        throw Error('AG Charts - error allocating meta');
    }
}

function allocateMeta<T extends keyof ProxyMeta>(params: ProxyMeta[T]['params']): ProxyMeta[T] {
    const meta = { params, result: undefined } as unknown as ProxyMeta[T];
    meta.result = allocateResult(meta.params.type);
    return meta;
}

export class ProxyInteractionService {
    private readonly destroyFns: Array<() => void> = [];

    private dragState?: {
        target: HTMLElement;
        start: {
            offsetX: number;
            offsetY: number;
            pageX: number;
            pageY: number;
        };
    };

    constructor(
        private readonly localeManager: LocaleManager,
        private readonly domManager: DOMManager
    ) {}

    destroy() {
        this.destroyFns.forEach((fn) => fn());
    }

    private addLocalisation(fn: () => void) {
        fn();
        // FIXME(olegat) The result of `addListener` must be freed when the HTMLElement goes out of scope.
        this.destroyFns.push(this.localeManager.addListener('locale-changed', fn));
    }

    createProxyContainer<T extends ProxyContainerType>(
        args: { type: T } & ProxyMeta[T]['params']
    ): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = allocateMeta(args);
        const { params, result: div } = meta;

        this.domManager.addChild('canvas-proxy', params.domManagerId, div);
        div.classList.add(...params.classList, 'ag-charts-proxy-container');
        div.role = params.type;
        if ('ariaOrientation' in params) {
            div.ariaOrientation = params.ariaOrientation;
        }

        if (typeof params.ariaHidden === 'boolean') {
            div.ariaHidden = params.ariaHidden.toString();
        }

        this.addLocalisation(() => {
            div.ariaLabel = this.localeManager.t(params.ariaLabel.id, params.ariaLabel.params);
        });

        return div;
    }

    createProxyElement<T extends ProxyElementType>(args: { type: T } & ProxyMeta[T]['params']): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = allocateMeta(args);

        if (checkType('button', meta)) {
            const { params, result: button } = meta;
            this.initInteract(params, button);

            if (typeof params.textContent === 'string') {
                button.textContent = params.textContent;
            } else {
                const { textContent } = params;
                this.addLocalisation(() => {
                    button.textContent = this.localeManager.t(textContent.id, textContent.params);
                });
            }
            this.setParent(params, button);
        }

        if (checkType('slider', meta)) {
            const { params, result: slider } = meta;
            this.initInteract(params, slider);
            slider.type = 'range';
            slider.role = 'presentation';
            slider.style.margin = '0px';
            slider.ariaOrientation = params.ariaOrientation;

            this.addLocalisation(() => {
                slider.ariaLabel = this.localeManager.t(params.ariaLabel.id, params.ariaLabel.params);
            });
            this.setParent(params, slider);
        }

        if (checkType('text', meta)) {
            const { params, result: text } = meta;
            this.initElement(params, text.getContainer());
            this.setParent(params, text.getContainer());
        }

        if (checkType('listswitch', meta)) {
            const {
                params,
                result: { button, listitem },
            } = meta;
            this.initInteract(params, button);
            button.style.width = '100%';
            button.style.height = '100%';
            button.textContent = params.textContent;
            button.role = 'switch';
            button.ariaChecked = params.ariaChecked.toString();
            button.setAttribute('aria-describedby', params.ariaDescribedBy);

            listitem.role = 'listitem';
            listitem.style.position = 'absolute';
            listitem.replaceChildren(button);
            this.setParent(params, listitem);
        }

        if (checkType('region', meta)) {
            const { params, result: region } = meta;
            this.initInteract(params, region);
            region.role = 'region';
            this.setParent(params, region);
        }

        return meta.result;
    }

    createDragListeners(args: {
        element: HTMLElement;
        onDragStart?: ProxyDragHandler;
        onDrag?: ProxyDragHandler;
        onDragEnd?: ProxyDragHandler;
    }): () => void {
        const { element, onDragStart, onDrag, onDragEnd } = args;

        const mousedown = (sourceEvent: MouseEvent) => {
            const { button, offsetX, offsetY, pageX, pageY } = sourceEvent;
            if (button === 0) {
                this.dragState = { target: element, start: { offsetX, offsetY, pageX, pageY } };
                onDragStart?.(ProxyInteractionService.makeDragEvent(this.dragState, sourceEvent));
            }
        };
        const mousemove = (sourceEvent: MouseEvent) => {
            if (this.dragState?.target === element) {
                onDrag?.(ProxyInteractionService.makeDragEvent(this.dragState, sourceEvent));
            }
        };
        const mouseup = (sourceEvent: MouseEvent) => {
            if (this.dragState?.target === element && sourceEvent.button === 0) {
                onDragEnd?.(ProxyInteractionService.makeDragEvent(this.dragState, sourceEvent));
                this.dragState = undefined;
            }
        };

        // TODO: We only need 1 window listener. Not one per draggable element.
        const window = getWindow();
        element.addEventListener('mousedown', mousedown);
        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup);

        return () => {
            element.removeEventListener('mousedown', mousedown);
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);
        };
    }

    private static makeDragEvent(
        { start }: NonNullable<ProxyInteractionService['dragState']>,
        sourceEvent: MouseEvent
    ): ProxyDragHandlerEvent {
        // [offsetX, offsetY] is relative to the sourceEvent.target, which can be another element
        // such as a legend button. Therefore, calculate [offsetX, offsetY] relative to the axis
        // element that fired the 'mousedown' event.
        const originDeltaX = sourceEvent.pageX - start.pageX;
        const originDeltaY = sourceEvent.pageY - start.pageY;
        return {
            offsetX: start.offsetX + originDeltaX,
            offsetY: start.offsetY + originDeltaY,
            originDeltaX,
            originDeltaY,
        };
    }

    private initElement<T extends ProxyElementType, TElem extends HTMLElement>(params: ElemParams<T>, element: TElem) {
        setAttribute(element, 'id', params.id);
        setElementStyle(element, 'cursor', params.cursor);
        element.classList.toggle('ag-charts-proxy-elem', true);
    }

    private initInteract<T extends ProxyElementType, TElem extends HTMLElement>(
        params: InteractParams<T>,
        element: TElem
    ) {
        const { onclick, ondblclick, onmouseenter, onmouseleave, oncontextmenu, onchange, onfocus, onblur, tabIndex } =
            params;
        this.initElement(params, element);

        if (tabIndex !== undefined) {
            element.tabIndex = tabIndex;
        }

        if (onclick) {
            element.addEventListener('click', onclick);
        }
        if (ondblclick) {
            element.addEventListener('dblclick', ondblclick);
        }
        if (onmouseenter) {
            element.addEventListener('mouseenter', onmouseenter);
        }
        if (onmouseleave) {
            element.addEventListener('mouseleave', onmouseleave);
        }
        if (oncontextmenu) {
            element.addEventListener('contextmenu', oncontextmenu);
        }
        if (onfocus) {
            element.addEventListener('focus', onfocus);
        }
        if (onblur) {
            element.addEventListener('blur', onblur);
        }
        if (onchange) {
            element.addEventListener('change', onchange);
        }
    }

    private setParent<T extends ProxyElementType, TElem extends HTMLElement>(params: ElemParams<T>, element: TElem) {
        const { parent } = params;
        if (typeof parent === 'string') {
            const insert = { where: parent, query: '.ag-charts-series-area' };
            this.domManager.addChild('canvas-proxy', params.domManagerId, element, insert);
        } else {
            parent.appendChild(element);
        }
    }
}
