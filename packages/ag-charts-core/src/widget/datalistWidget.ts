import { createElement } from '../dom/domElements';
import { createElementId } from '../identity/id';
import { Widget } from './widget';

/** A `<datalist>` of suggested values, with a generated id for an input's `list` attribute (see `InputWidget.setList`). */
export class DatalistWidget extends Widget<HTMLDataListElement> {
    constructor(values: readonly string[]) {
        super(createElement('datalist'));
        this.id = createElementId();
        for (const value of values) {
            const option = createElement('option');
            option.value = value;
            this.elem.append(option);
        }
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
