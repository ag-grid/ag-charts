import { BBox } from '../scene/bbox';
import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import { getDocument, getWindow, setElementBBox } from '../util/dom';
import { ObserveChanges } from '../util/proxy';
import type { FocusSwapChain } from './focusSwapChain';

type Focus = Path | BBox;

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly path: SVGPathElement;
    private readonly div: HTMLDivElement;

    @ObserveChanges<FocusIndicator>((target) => target.update())
    rect: BBox | undefined = undefined;

    @ObserveChanges<FocusIndicator>((target) => target.update())
    focus: Focus | undefined = undefined;

    @ObserveChanges<FocusIndicator>((target) => target.update())
    clip: boolean = false;

    constructor(private readonly swapChain: FocusSwapChain) {
        this.div = getDocument().createElement('div');
        this.svg = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.path = getDocument().createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svg.append(this.path);

        this.element = getDocument().createElement('div');
        this.element.classList.add('ag-charts-focus-indicator');
        this.element.ariaHidden = 'true';
        this.element.append(this.svg);
        this.swapChain.addListener('swap', (parent) => this.onSwap(parent));
    }

    private update() {
        const { focus, rect, clip } = this;

        if (focus === undefined || rect == null) {
            return;
        } else if (focus instanceof Path) {
            const transform = (localX: number, localY: number) => {
                let { x, y } = Transformable.toCanvasPoint(focus, localX, localY);
                x -= rect?.x ?? 0;
                y -= rect?.y ?? 0;
                return { x, y };
            };
            this.path.setAttribute('d', focus.svgPathData(transform));
            this.show(this.svg);
        } else {
            let bbox: BBox;
            if (clip) {
                const x0 = Math.max(focus.x - rect.x, 0);
                const y0 = Math.max(focus.y - rect.y, 0);
                const x1 = Math.min(focus.x + focus.width - rect.x, rect.width);
                const y1 = Math.min(focus.y + focus.height - rect.y, rect.height);
                bbox = new BBox(x0, y0, x1 - x0, y1 - y0);
            } else {
                bbox = new BBox(focus.x - rect.x, focus.y - rect.y, focus.width, focus.height);
            }

            setElementBBox(this.div, bbox);
            this.show(this.div);
        }
    }

    private onSwap(newParent: HTMLElement) {
        if (newParent === this.element.parentElement) return;
        this.element.remove();
        newParent.appendChild(this.element);
        this.overrideFocusVisible(this.focusVisible);
    }

    private show(child: Element) {
        this.element.innerHTML = '';
        this.element.append(child);
    }

    // Use with caution! The focus must be visible when using the keyboard.
    private focusVisible?: boolean;
    overrideFocusVisible(focusVisible: boolean | undefined) {
        this.focusVisible = focusVisible;
        const opacity = { true: '1', false: '0', undefined: '' } as const;
        const parent = this.element.parentElement;
        parent?.style.setProperty('opacity', opacity[`${focusVisible}`]);
    }

    // Get the `:focus-visible` CSS state.
    public isFocusVisible(): boolean {
        const parent = this.element.parentElement;
        return parent != null && getWindow().getComputedStyle(parent).opacity === '1';
    }
}
