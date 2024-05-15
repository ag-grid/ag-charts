import type { BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import { Debug } from '../../util/debug';
import { createElement } from '../../util/dom';
import type { FocusIndicator } from './focusIndicator';

type ProxyType = 'button';

type ProxyParams<T extends ProxyType> = {
    type: T;
    id: string;
    textContext: string;
    parent: HTMLElement;
    focusable: BBoxProvider<BBoxValues>;
    onclick?: (ev: MouseEvent) => void;
};

type ProxyReturnMap = {
    button: HTMLButtonElement;
};

export class ProxyInteractionService {
    // This debug option make the proxies button partially transparent instead of fully transparent.
    // To enabled this option, set window.agChartsDebug = ['showDOMProxies'].
    private readonly debugShowDOMProxies: boolean = Debug.check('showDOMProxies');

    constructor(private readonly focusIndicator: FocusIndicator) {}

    createProxyElement<T extends ProxyType>(params: ProxyParams<T>): ProxyReturnMap[T] | undefined {
        const { type, id, parent, focusable, textContext, onclick } = params;
        if (type === 'button') {
            const newButton = createElement('button');

            newButton.id = id;
            newButton.textContent = textContext;
            newButton.style.pointerEvents = 'none';
            newButton.style.opacity = this.debugShowDOMProxies ? '0.25' : '0';
            newButton.addEventListener('focus', (_event: FocusEvent): any => {
                newButton.style.setProperty('pointerEvents', null);
                this.focusIndicator.updateBBox(focusable.getCachedBBox());
            });
            newButton.addEventListener('blur', (_event: FocusEvent): any => {
                newButton.style.pointerEvents = 'none';
                this.focusIndicator.updateBBox(undefined);
            });
            if (onclick) {
                newButton.addEventListener('click', onclick);
            }

            parent.appendChild(newButton);
            return newButton;
        }
    }
}
