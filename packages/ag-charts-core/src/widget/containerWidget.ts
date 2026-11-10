import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

/** A plain `<div>` that holds other widgets, with no role or behaviour of its own. */
export class ContainerWidget extends Widget<HTMLDivElement> {
    /**
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param classNames - Class names to add.
     */
    constructor(...args: WithOwnerDocument<string[]>) {
        const [ownerDocument, classNames] = splitOwnerDocument(args);
        super(ownerDocument.createElement('div'));
        if (classNames.length > 0) this.addClass(...classNames);
    }

    /**
     * Centres the content in a box that fills the parent's height inside a `margin` (in CSS pixels), using the chart's
     * theme font and text colour. The styles are inline so that page stylesheets cannot override them.
     */
    setCentredThemeText(margin: number) {
        Object.assign(this.elem.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            height: '100%',
            margin: `${margin}px`,
            fontFamily: 'var(--ag-charts-font-family)',
            fontSize: 'var(--ag-charts-font-size)',
            fontWeight: 'var(--ag-charts-font-weight)',
            color: 'var(--ag-charts-text-color)',
        } satisfies Partial<CSSStyleDeclaration>);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
