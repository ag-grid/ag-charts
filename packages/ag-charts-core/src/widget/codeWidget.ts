import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

/** Text shown as code: inline within a sentence, or as a preformatted block. */
export class CodeWidget extends Widget<HTMLElement> {
    /**
     * An inline `<code>` run, such as an option name within a message.
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param classNames - Class names to add.
     */
    static inline(...args: WithOwnerDocument<[text: string, ...classNames: string[]]>): CodeWidget {
        const [ownerDocument, [text, ...classNames]] = splitOwnerDocument(args);
        return new CodeWidget(ownerDocument.createElement('code'), text, classNames);
    }

    /**
     * A preformatted `<pre>` block, such as a multi-line snippet.
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param classNames - Class names to add.
     */
    static block(...args: WithOwnerDocument<[text: string, ...classNames: string[]]>): CodeWidget {
        const [ownerDocument, [text, ...classNames]] = splitOwnerDocument(args);
        return new CodeWidget(ownerDocument.createElement('pre'), text, classNames);
    }

    private constructor(elem: HTMLElement, text: string, classNames: string[]) {
        super(elem);
        if (classNames.length > 0) this.addClass(...classNames);
        this.setTextContent(text);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
