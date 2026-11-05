import type { AgIconName } from 'ag-charts-types';

import { setAttribute } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import { getIconClassNames } from '../dom/domUtil';
import { Widget } from './widget';

/**
 * A decorative icon. Icons are `aria-hidden` by default because the accessible name belongs on the control that
 * contains them (see `LabelIcon`); call `setAriaHidden(undefined)` to undo this.
 */
export class IconWidget extends Widget<HTMLSpanElement | HTMLImageElement> {
    /**
     * An icon from the AG Charts icon font, rendered as a `<span>` with the icon's class names.
     * @param classNames - Extra class names, added after the icon's own.
     */
    static fromName(icon: AgIconName, ...classNames: string[]): IconWidget {
        return new IconWidget(createElement('span', getIconClassNames(icon)), classNames);
    }

    /**
     * An icon loaded from an image URL, rendered as an `<img>`.
     * @param classNames - Extra class names.
     */
    static fromUrl(src: string, ...classNames: string[]): IconWidget {
        const img = createElement('img');
        img.src = src;
        return new IconWidget(img, classNames);
    }

    private constructor(elem: HTMLSpanElement | HTMLImageElement, classNames: string[]) {
        super(elem);
        if (classNames.length > 0) this.addClass(...classNames);
        setAttribute(elem, 'aria-hidden', true);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
