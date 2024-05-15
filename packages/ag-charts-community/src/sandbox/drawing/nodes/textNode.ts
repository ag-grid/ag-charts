import type { FontSize, FontWeight, TextWrap } from '../../../options/chart/types';
import type { LineMetrics } from '../../../util/textMeasurer';
import type { CssColor, FontOptions, TextOptions } from '../../types/commonTypes';
import { SpatialNode } from './spatialNode';

export class TextNode extends SpatialNode implements TextOptions, FontOptions {
    text: string = '';
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
    textWrap?: TextWrap;

    color?: CssColor;
    fontSize?: FontSize;
    fontFamily?: string;
    fontWeight?: FontWeight;
    fontStyle?: string;

    protected textMetrics: LineMetrics = { width: 0, height: 0, offsetTop: 0, offsetLeft: 0, lineHeight: 1 };

    hasContent() {
        return Boolean(this.text);
    }

    getBBox() {
        const { width, height, offsetTop, offsetLeft } = this.textMetrics;
        return { x: offsetLeft, y: offsetTop, width, height };
    }

    getSize() {
        const { width, height } = this.textMetrics;
        return { width, height };
    }
}
