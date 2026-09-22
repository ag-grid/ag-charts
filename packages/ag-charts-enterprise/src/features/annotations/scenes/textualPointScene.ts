import { _ModuleSupport } from 'ag-charts-community';
import type { BoxBounds, Point } from 'ag-charts-core';

import type { TextInputLayout } from '../../text-input/textInput';
import type { AnnotationContext, Padding } from '../annotationTypes';
import type { TextualPointDatum } from '../datum/textualDatum';
import {
    type AnnotationTextAlignment,
    type AnnotationTextPosition,
    type TextOptions,
    getAnnotationText,
    getBBox,
    uniformPadding,
    updateTextNode,
} from '../text/util';
import { convertPoint, invertCoords } from '../utils/values';
import { PointScene } from './pointScene';

export abstract class TextualPointScene<Datum extends TextualPointDatum> extends PointScene<Datum> {
    override activeHandle?: string;

    protected abstract textPosition: AnnotationTextPosition;
    protected abstract readonly textAlignment: AnnotationTextAlignment;
    protected readonly textWidth?: number;

    protected readonly label = new _ModuleSupport.Text({ zIndex: 1 });

    protected override anchor: _ModuleSupport.FloatingToolbarAnchor = {
        x: 0,
        y: 0,
        position: 'above-left',
    };

    private textInputBBox?: _ModuleSupport.BBox;

    public setTextInputBBox(bbox?: _ModuleSupport.BBox) {
        this.textInputBBox = bbox;
        this.markDirty('TextualPointScene');
    }

    public override update(datum: Datum, context: AnnotationContext) {
        const coords = convertPoint(datum, context);
        const bbox = this.getTextBBox(datum, coords, context);

        this.updateLabel(datum, bbox, context);
        this.updateHandle(datum, coords, bbox);
        this.updateShape(datum, bbox);

        this.anchor = this.updateAnchor(datum, bbox, context);
    }

    public override copy<D extends Datum>(datum: D, copiedDatum: D, context: AnnotationContext): D | undefined {
        const coords = convertPoint(datum, context);
        const bbox = this.getTextBBox(datum, coords, context);

        const padding = this.getPadding(datum);
        const horizontalPadding = padding.left + padding.right;
        const verticalPadding = padding.top + padding.bottom;

        const xOffset = (bbox.width + horizontalPadding) / 2;
        const yOffset = bbox.height + verticalPadding;

        const point = invertCoords({ x: coords.x - xOffset, y: coords.y - yOffset }, context);

        copiedDatum.x = point.x;
        copiedDatum.y = point.y;

        return copiedDatum;
    }

    override containsPoint(x: number, y: number) {
        const { label } = this;
        return super.containsPoint(x, y) || (label.visible && label.containsPoint(x, y));
    }

    override getNodeAtCoords(x: number, y: number): string | undefined {
        if (this.label.visible && this.label.containsPoint(x, y)) return 'text';

        return super.getNodeAtCoords(x, y);
    }

    public getTextInputLayout(datum: TextualPointDatum, context: AnnotationContext): TextInputLayout {
        return {
            getTextInputCoords: (height) => this.getTextInputCoords(datum, context, height),
            getTextPosition: () => this.textPosition,
            alignment: this.textAlignment,
            textAlign: datum.textAlign,
            width: this.textWidth,
        };
    }

    public getPlaceholderColor(_datum: TextualPointDatum): string | undefined {
        return undefined;
    }

    protected getTextInputCoords(datum: TextualPointDatum, context: AnnotationContext, _height: number): Point {
        return convertPoint(datum, context);
    }

    protected getPadding(datum: TextualPointDatum): Padding {
        return uniformPadding(datum.padding ?? 0);
    }

    protected getTextOptions(datum: TextualPointDatum): TextOptions & { width?: number } {
        const { fontFamily, fontSize, fontStyle, fontWeight, textAlign } = datum;
        return {
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            textAlign,
            position: this.textPosition,
            width: this.textWidth,
        };
    }

    protected getTextBBox(datum: Datum, coords: Point, context: AnnotationContext) {
        const { text } = getAnnotationText(datum.text, context.localeManager);
        return getBBox(this.getTextOptions(datum), text, { x: coords.x, y: coords.y }, this.textInputBBox);
    }

    protected updateLabel(datum: Datum, bbox: BoxBounds, context: AnnotationContext) {
        const { text, isPlaceholder } = getAnnotationText(datum.text, context.localeManager);
        const labelCoords = this.getLabelCoords(datum, bbox);

        if (context.isRtl) {
            labelCoords.x += bbox.width;
        }

        const config = {
            ...this.getTextOptions(datum),
            visible: datum.visible,
            color: datum.color,
            placeholderColor: this.getPlaceholderColor(datum),
        };
        updateTextNode(this.label, text, isPlaceholder, config, labelCoords, this.getTextBaseline(datum));
    }

    protected updateShape(_datum: Datum, _bbox: BoxBounds) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected override updateAnchor(_datum: Datum, bbox: BoxBounds, context: AnnotationContext) {
        return {
            x: context.isRtl ? bbox.x - bbox.width + context.seriesRect.x : bbox.x + context.seriesRect.x,
            y: bbox.y + context.seriesRect.y - bbox.height,
            position: this.anchor.position,
        };
    }

    protected getLabelCoords(_datum: Datum, bbox: BoxBounds): Point {
        return bbox;
    }

    protected getTextBaseline(_datum: Datum): CanvasTextBaseline {
        return this.textPosition == 'center' ? 'middle' : this.textPosition;
    }

    protected override getHandleCoords(_datum: Datum, _coords: Point, bbox: _ModuleSupport.BBox): Point {
        return bbox;
    }

    protected override getHandleStyles(datum: Datum) {
        const styles = super.getHandleStyles(datum);
        styles.stroke = datum.handle.stroke ?? datum.color;
        return styles;
    }
}
