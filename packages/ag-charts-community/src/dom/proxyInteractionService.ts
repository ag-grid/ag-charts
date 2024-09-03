import type { Direction } from 'ag-charts-types';

import type { LocaleManager } from '../locale/localeManager';
import type { BBoxProvider, BBoxValues } from '../util/bboxinterface';
import { Debug } from '../util/debug';
import { createElement } from '../util/dom';
import { BoundedText } from './boundedText';
import type { DOMElementClass, DOMManager } from './domManager';
import type { FocusIndicator } from './focusIndicator';

export type ListSwitch = { button: HTMLButtonElement; listitem: HTMLElement };

type UpdateServiceLike = {
    addListener(type: 'update-complete', handler: () => unknown): () => void;
};

type ElemParams<T extends ProxyElementType> = {
    readonly type: T;
    readonly id: string;
    readonly parent: HTMLElement | DOMElementClass;
};

type InteractParams<T extends ProxyElementType> = ElemParams<T> & {
    readonly focusable: BBoxProvider<BBoxValues>;
    readonly tabIndex?: number;
    readonly onclick?: (ev: MouseEvent) => void;
    readonly onchange?: (ev: Event) => void;
    readonly onfocus?: (ev: FocusEvent) => void;
    readonly onblur?: (ev: FocusEvent) => void;
};

type TranslationKey = { id: string; params?: Record<string, any> };

type ContainerParams<T extends ProxyContainerType> = {
    readonly type: T;
    readonly id: string;
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
            readonly ariaRoleDescription: TranslationKey;
            readonly ariaDescribedBy: string;
        };
        result: ListSwitch;
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

type ProxyElementType = 'button' | 'slider' | 'text' | 'listswitch';
type ProxyContainerType = 'toolbar' | 'group' | 'list';

function checkType<T extends keyof ProxyMeta>(type: T, meta: ProxyMeta[keyof ProxyMeta]): meta is ProxyMeta[T] {
    return meta.params?.type === type;
}

function allocateResult<T extends keyof ProxyMeta>(type: T): ProxyMeta[T]['result'] {
    if ('button' === type) {
        return createElement('button');
    } else if ('slider' === type) {
        return createElement('input');
    } else if (['toolbar', 'group', 'list'].includes(type)) {
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
    // This debug option make the proxies button partially transparent instead of fully transparent.
    // To enabled this option, set window.agChartsDebug = ['showDOMProxies'].
    private readonly debugShowDOMProxies: boolean = Debug.check('showDOMProxies');
    private focusable?: BBoxProvider<BBoxValues>;
    private readonly destroyFns: Array<() => void> = [];

    constructor(
        updateService: UpdateServiceLike,
        private readonly localeManager: LocaleManager,
        private readonly domManager: DOMManager,
        private readonly focusIndicator: FocusIndicator
    ) {
        this.destroyFns.push(updateService.addListener('update-complete', () => this.update()));
    }

    destroy() {
        this.destroyFns.forEach((fn) => fn());
    }

    private update() {
        if (this.focusable) {
            this.focusIndicator.updateBounds(this.focusable.toCanvasBBox());
        }
    }

    private addLocalisation(fn: () => void) {
        fn();
        this.destroyFns.push(this.localeManager.addListener('locale-changed', fn));
    }

    createProxyContainer<T extends ProxyContainerType>(
        args: { type: T } & ProxyMeta[T]['params']
    ): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = allocateMeta(args);
        const { params, result: div } = meta;

        this.domManager.addChild('canvas-overlay', params.id, div);
        div.classList.add(...params.classList);
        div.style.pointerEvents = 'none';
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
            this.addLocalisation(() => {
                button.ariaRoleDescription = this.localeManager.t(params.ariaRoleDescription.id);
            });

            listitem.role = 'listitem';
            listitem.style.position = 'absolute';
            listitem.replaceChildren(button);
            this.setParent(params, listitem);
        }

        return meta.result;
    }

    private initElement<T extends ProxyElementType, TElem extends HTMLElement>(params: ElemParams<T>, element: TElem) {
        const { id } = params;
        element.id = id;
        element.style.pointerEvents = 'none';
        element.style.opacity = this.debugShowDOMProxies ? '0.25' : '0';
        element.style.position = 'absolute';
        element.style.overflow = 'hidden';
    }

    private initInteract<T extends ProxyElementType, TElem extends HTMLElement>(
        params: InteractParams<T>,
        element: TElem
    ) {
        const { focusable, onclick, onchange, onfocus, onblur, tabIndex } = params;
        this.initElement(params, element);

        if (tabIndex !== undefined) {
            element.tabIndex = tabIndex;
        }

        element.addEventListener('focus', (_event: FocusEvent): any => {
            this.focusable = focusable;
            element.style.setProperty('pointerEvents', null);
            this.focusIndicator.updateBounds(focusable.toCanvasBBox());
        });
        element.addEventListener('blur', (_event: FocusEvent): any => {
            this.focusable = undefined;
            element.style.pointerEvents = 'none';
            this.focusIndicator.updateBounds(undefined);
        });
        if (onclick) {
            element.addEventListener('click', onclick);
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
        const { id, parent } = params;
        if (typeof parent === 'string') {
            this.domManager.addChild(parent, id, element);
        } else {
            parent.appendChild(element);
        }
    }
}
