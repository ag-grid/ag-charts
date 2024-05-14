import type { BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import { Debug } from '../../util/debug';
import { createElement } from '../../util/dom';
import type { FocusIndicator } from './focusIndicator';

type ProxyTypeMap = {
    button: HTMLButtonElement;
    slider: HTMLInputElement;
};

type ProxyParams<T extends keyof ProxyTypeMap> = {
    readonly type: T;
    readonly id: string;
    readonly textContent: string;
    readonly parent: HTMLElement;
    readonly focusable: BBoxProvider<BBoxValues>;
    readonly onclick?: (ev: MouseEvent) => void;
};

function check<T extends keyof ProxyTypeMap>(
    params: ProxyParams<keyof ProxyTypeMap>,
    type: T
): params is ProxyParams<T> {
    return params.type === type;
}

function createInput(type: 'range') {
    const input = createElement('input');
    input.type = type;
    return input;
}

export class ProxyInteractionService {
    // This debug option make the proxies button partially transparent instead of fully transparent.
    // To enabled this option, set window.agChartsDebug = ['showDOMProxies'].
    private readonly debugShowDOMProxies: boolean = Debug.check('showDOMProxies');

    constructor(private readonly focusIndicator: FocusIndicator) {}

    createProxyElement<T extends keyof ProxyTypeMap>(params: ProxyParams<T>): ProxyTypeMap[T] {
        if (check(params, 'button')) {
            return this.initElement(params, createElement('button'));
        } else if (check(params, 'slider')) {
            return this.initElement(params, createInput('range'));
        } else {
            throw new Error(`unexpected type [${params.type}]`);
        }
    }

    private initElement<T extends keyof ProxyTypeMap>(params: ProxyParams<T>, element: ProxyTypeMap[T]) {
        const { id, parent, textContent } = params;

        element.id = id;
        element.textContent = textContent;
        element.style.pointerEvents = 'none';
        element.style.opacity = this.debugShowDOMProxies ? '0.25' : '0';
        element.style.position = 'absolute';
        this.initListeners(params, element);

        parent.appendChild(element);
        return element;
    }

    private initListeners<T extends keyof ProxyTypeMap, TElem extends HTMLElement>(
        params: ProxyParams<T>,
        element: TElem
    ) {
        const { focusable, onclick } = params;
        element.addEventListener('focus', (_event: FocusEvent): any => {
            element.style.setProperty('pointerEvents', null);
            this.focusIndicator.updateBBox(focusable.getCachedBBox());
        });
        element.addEventListener('blur', (_event: FocusEvent): any => {
            element.style.pointerEvents = 'none';
            this.focusIndicator.updateBBox(undefined);
        });
        if (onclick) {
            element.addEventListener('click', onclick);
        }
    }
}
