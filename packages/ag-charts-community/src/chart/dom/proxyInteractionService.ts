import type { Direction } from 'ag-charts-types';

import type { BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import { Debug } from '../../util/debug';
import { createElement } from '../../util/dom';
import type { LocaleManager } from '../locale/localeManager';
import type { UpdateService } from '../updateService';
import { BoundedText } from './boundedText';
import type { DOMManager } from './domManager';
import type { FocusIndicator } from './focusIndicator';

type ElemParams<T extends ProxyElementType> = {
    readonly type: T;
    readonly id: string;
    readonly parent: HTMLElement;
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
    toolbar: {
        params: ContainerParams<'toolbar'>;
        result: HTMLDivElement;
    };
    group: {
        params: ContainerParams<'group'>;
        result: HTMLDivElement;
    };
};

type ProxyElementType = 'button' | 'slider' | 'text';
type ProxyContainerType = 'toolbar' | 'group';

function checkType<T extends keyof ProxyMeta>(type: T, meta: ProxyMeta[keyof ProxyMeta]): meta is ProxyMeta[T] {
    return meta.params?.type === type;
}

function allocateResult<T extends keyof ProxyMeta>(type: T): ProxyMeta[T]['result'] {
    if ('button' === type) {
        return createElement('button');
    } else if ('slider' === type) {
        return createElement('input');
    } else if ('toolbar' === type || 'group' === type) {
        return createElement('div');
    } else if ('text' === type) {
        return new BoundedText();
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
        updateService: UpdateService,
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
            this.focusIndicator.updateBounds(this.focusable.computeTransformedBBox());
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
        div.ariaOrientation = params.ariaOrientation;

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
        }

        if (checkType('text', meta)) {
            const { params, result: text } = meta;
            this.initElement(params, text.getContainer());
        }

        return meta.result;
    }

    private initElement<T extends ProxyElementType, TElem extends HTMLElement>(
        params: ElemParams<T>,
        element: TElem
    ) {
        const { id, parent } = params;
        element.id = id;
        element.style.pointerEvents = 'none';
        element.style.opacity = this.debugShowDOMProxies ? '0.25' : '0';
        element.style.position = 'absolute';
        element.style.overflow = 'hidden';
        parent.appendChild(element);
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
            this.focusIndicator.updateBounds(focusable.computeTransformedBBox());
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
}
