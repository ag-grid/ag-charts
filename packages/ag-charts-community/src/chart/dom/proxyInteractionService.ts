import type { BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import { Debug } from '../../util/debug';
import { createElement } from '../../util/dom';
import type { UpdateService } from '../updateService';
import type { FocusIndicator } from './focusIndicator';

type ProxyTypeMap = {
    button: HTMLButtonElement;
    slider: HTMLInputElement;
    'div-scrollbar': HTMLDivElement;
};

type ProxyParams<T extends keyof ProxyTypeMap> = {
    readonly type: T;
    readonly id: string;
    readonly textContent: string;
    readonly parent: HTMLElement;
    readonly focusable: BBoxProvider<BBoxValues>;
    readonly onclick?: (ev: MouseEvent) => void;
    readonly onchange?: (ev: Event) => void;
};

function check<T extends keyof ProxyTypeMap>(
    params: ProxyParams<keyof ProxyTypeMap>,
    type: T
): params is ProxyParams<T> {
    return params.type === type;
}

export class ProxyInteractionService {
    // This debug option make the proxies button partially transparent instead of fully transparent.
    // To enabled this option, set window.agChartsDebug = ['showDOMProxies'].
    private readonly debugShowDOMProxies: boolean = Debug.check('showDOMProxies');
    private focusable?: BBoxProvider<BBoxValues>;

    constructor(
        updateService: UpdateService,
        private readonly focusIndicator: FocusIndicator
    ) {
        updateService.addListener('update-complete', () => this.update());
    }

    private update() {
        if (this.focusable) {
            this.focusIndicator.updateBBox(this.focusable.getCachedBBox());
        }
    }

    private createDivWithRole(role: 'scrollbar') {
        const input = createElement('div');
        input.role = role;
        input.tabIndex = 0;
        if (this.debugShowDOMProxies) {
            input.style.background = ({ slider: 'red', scrollbar: 'green' } as const)[role];
        }
        return input;
    }

    private createSlider() {
        const input = createElement('input');
        input.type = 'range';
        input.style.margin = '0px';
        return input;
    }

    createProxyElement<T extends keyof ProxyTypeMap>(params: ProxyParams<T>): ProxyTypeMap[T] {
        if (check(params, 'button')) {
            return this.initElement(params, createElement('button'));
        } else if (check(params, 'slider')) {
            return this.initElement(params, this.createSlider());
        } else if (check(params, 'div-scrollbar')) {
            return this.initElement(params, this.createDivWithRole('scrollbar'));
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
        const { focusable, onclick, onchange } = params;
        element.addEventListener('focus', (_event: FocusEvent): any => {
            this.focusable = focusable;
            element.style.setProperty('pointerEvents', null);
            this.focusIndicator.updateBBox(focusable.getCachedBBox());
        });
        element.addEventListener('blur', (_event: FocusEvent): any => {
            this.focusable = undefined;
            element.style.pointerEvents = 'none';
            this.focusIndicator.updateBBox(undefined);
        });
        if (onclick) {
            element.addEventListener('click', onclick);
        }
        if (onchange) {
            element.addEventListener('change', onchange);
        }
    }
}
