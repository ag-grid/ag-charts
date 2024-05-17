import type { BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import { Debug } from '../../util/debug';
import { createElement } from '../../util/dom';
import type { UpdateService } from '../updateService';
import type { FocusIndicator } from './focusIndicator';

type BaseProxyParams<T extends keyof ProxyMeta> = {
    readonly type: T;
    readonly id: string;
    readonly parent: HTMLElement;
    readonly focusable: BBoxProvider<BBoxValues>;
    readonly onclick?: (ev: MouseEvent) => void;
    readonly onchange?: (ev: Event) => void;
};

type ProxyMeta = {
    button: {
        params: BaseProxyParams<'button'> & { readonly textContent: string };
        result: HTMLButtonElement;
    };
    slider: {
        params: BaseProxyParams<'slider'> & { readonly ariaLabel: string };
        result: HTMLInputElement;
    };
};

function checkType<T extends keyof ProxyMeta>(
    type: T,
    meta: Pick<ProxyMeta[keyof ProxyMeta], 'params'>
): meta is Pick<ProxyMeta[T], 'params'> {
    return meta.params?.type === type;
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

    private allocateMeta<T extends keyof ProxyMeta>(params: ProxyMeta[T]['params']): ProxyMeta[T] {
        const map = { button: 'button', slider: 'input' } as const;
        return { params, result: createElement(map[params.type]) } as ProxyMeta[T];
    }

    createProxyElement<T extends keyof ProxyMeta>(
        args: BaseProxyParams<T> & ProxyMeta[T]['params']
    ): ProxyMeta[T]['result'] {
        const meta: ProxyMeta[T] = this.allocateMeta(args);

        if (checkType('button', meta)) {
            const { params, result: button } = meta;
            this.initElement(params, button);
            button.textContent = params.textContent;
        }

        if (checkType('slider', meta)) {
            const { params, result: slider } = meta;
            this.initElement(params, slider);
            slider.type = 'range';
            slider.style.margin = '0px';
            slider.ariaLabel = params.ariaLabel;
        }

        return meta.result;
    }

    private initElement<T extends keyof ProxyMeta, TElem extends HTMLElement>(
        params: ProxyMeta[T]['params'],
        element: TElem
    ) {
        const { focusable, onclick, onchange, id, parent } = params;

        element.id = id;
        element.style.pointerEvents = 'none';
        element.style.opacity = this.debugShowDOMProxies ? '0.25' : '0';
        element.style.position = 'absolute';

        parent.appendChild(element);

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
