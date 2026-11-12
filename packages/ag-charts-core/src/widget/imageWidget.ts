import { createElement } from '../dom/domElements';
import { Widget } from './widget';

/** The box an inline image reserves, in CSS pixels. */
export interface ImageBox {
    width: number;
    height: number;
    padding: { top: number; right: number; bottom: number; left: number };
    verticalAlign: 'baseline' | 'top' | 'middle' | 'bottom';
    backgroundColor?: string;
    cornerRadius?: number;
}

/**
 * A content `<img>` with its own text alternative, such as an image segment within a run of text. The image is
 * scaled to fit inside its box without distortion. Use `IconWidget` for decorative icons instead.
 */
export class ImageWidget extends Widget<HTMLImageElement> {
    /**
     * @param src - The image URL.
     * @param alt - The text alternative; pass `''` for an image that conveys nothing.
     * @param box - The box the image reserves, which `padding` and `backgroundColor` decorate.
     */
    constructor(src: string, alt: string, box: ImageBox) {
        super(createElement('img'));
        const { padding: p, cornerRadius } = box;
        Object.assign(this.elem.style, {
            boxSizing: 'border-box',
            objectFit: 'contain',
            width: `${box.width}px`,
            height: `${box.height}px`,
            padding: `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`,
            verticalAlign: box.verticalAlign,
            backgroundColor: box.backgroundColor ?? '',
            borderRadius: cornerRadius == null ? '' : `${cornerRadius}px`,
        } satisfies Partial<CSSStyleDeclaration>);
        this.elem.src = src;
        this.elem.alt = alt;
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
