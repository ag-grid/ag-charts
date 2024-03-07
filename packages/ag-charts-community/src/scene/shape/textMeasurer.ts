import { isString } from '../../util/type-guards';
import { Text, type TextSizeProperties, getFont } from './text';

export class TextMeasurer {
    protected font: string;

    constructor(font: string | TextSizeProperties) {
        this.font = isString(font) ? font : getFont(font);
    }

    size(text: string) {
        return Text.getTextSize(text, this.font);
    }

    width(text: string): number {
        const { width } = this.size(text);
        return width;
    }
}
