import { Debug } from '../../sparklines-util';
import type { BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import { createElement, setElementBBox } from '../../util/dom';
import type { UpdateService } from '../updateService';
import type { DOMManager } from './domManager';
import type { FocusIndicator } from './focusIndicator';

type ProxyType = 'button';

type ProxyParams<T extends ProxyType> = {
    type: T;
    id: string;
    textContext: string;
    parent: HTMLElement;
    bboxprovider: BBoxProvider<BBoxValues>;
    onclick?: (ev: MouseEvent) => void;
};

type ProxyReturnMap = {
    button: HTMLButtonElement;
};

type ProxyNode = {
    element: HTMLElement;
    bboxprovider: BBoxProvider<BBoxValues>;
};

export class ProxyInteractionService {
    // This debug option make the proxies button partially transparent instead of fully transparent.
    // To enabled this option, set window.agChartsDebug = ['showDOMProxies'].
    private readonly debugShowDOMProxies: boolean = Debug.check('showDOMProxies');

    private nodes: ProxyNode[] = [];
    private readonly destroyFns: (() => void)[];

    constructor(
        updateService: UpdateService,
        private readonly focusIndicator: FocusIndicator
    ) {
        this.destroyFns = [updateService.addListener('update-complete', () => this.update())];
    }

    public destroy() {
        this.destroyFns.forEach((d) => d());
    }

    private update() {
        for (const { element, bboxprovider } of this.nodes) {
            setElementBBox(element, bboxprovider.getCachedBBox());
        }
    }

    createProxyElement<T extends ProxyType>(params: ProxyParams<T>): ProxyReturnMap[T] | undefined {
        const { type, id, parent, bboxprovider, textContext, onclick } = params;
        if (type === 'button') {
            const newButton = createElement('button');

            newButton.id = id;
            newButton.textContent = textContext;
            newButton.style.pointerEvents = 'none';
            newButton.style.opacity = this.debugShowDOMProxies ? '0.25' : '0';
            newButton.addEventListener('focus', (_event: FocusEvent): any => {
                newButton.style.setProperty('pointerEvents', null);
                this.focusIndicator.updateBBox(bboxprovider.getCachedBBox());
            });
            newButton.addEventListener('blur', (_event: FocusEvent): any => {
                newButton.style.pointerEvents = 'none';
                this.focusIndicator.updateBBox(undefined);
            });
            if (onclick) {
                newButton.addEventListener('click', onclick);
            }

            this.nodes.push({ element: newButton, bboxprovider });
            parent.appendChild(newButton);
            return newButton;
        }
    }
}
