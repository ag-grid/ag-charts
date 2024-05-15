import type { FontSize, FontWeight, TextWrap } from '../../../options/chart/types';
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

    override getBBox() {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    override getSize() {
        return { width: 0, height: 0 };
    }
}
