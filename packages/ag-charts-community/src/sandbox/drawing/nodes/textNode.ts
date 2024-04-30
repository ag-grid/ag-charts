import type { FontSize, FontWeight, TextWrap } from '../../../options/chart/types';
import type { CssColor } from '../../types/commonTypes';
import { SpatialNode } from './spatialNode';

// Represents a text node within a spatial node hierarchy, featuring text content, font styling, and layout properties.
export class TextNode extends SpatialNode {
    // Text content and alignment definitions
    text: string = '';
    textAlign: CanvasTextAlign = 'start';
    textBaseline: CanvasTextBaseline = 'alphabetic';
    textWrap: TextWrap = 'on-space';
    textMetrics?: TextMetrics;

    // Font style definitions
    color: CssColor = '#000';
    fontSize: FontSize = 12;
    fontFamily: string = 'Verdana, sans-serif';
    fontWeight: FontWeight = 'normal';
    fontStyle: string = 'normal';

    override getBBox() {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    override getSize() {
        return { width: 0, height: 0 };
    }

    measureText() {
        return (this.textMetrics ??= this.calculateTextMetrics());
    }

    protected calculateTextMetrics(): TextMetrics {
        // text wrap logic
        return null as any;
    }
}
