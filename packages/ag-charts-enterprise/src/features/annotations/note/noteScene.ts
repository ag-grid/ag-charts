import { _ModuleSupport } from 'ag-charts-community';
import { type BoxBounds, type Point, ZIndexMap, calcLineHeight, clamp, wrapText } from 'ag-charts-core';

import { type AnnotationContext, AnnotationType, type Padding } from '../annotationTypes';
import type { TextualPointDatum } from '../datum/textualDatum';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { TextualPointScene } from '../scenes/textualPointScene';
import { ANNOTATION_TEXT_LINE_HEIGHT, getBBox, uniformPadding } from '../text/util';
import { convertPoint } from '../utils/values';
import type { NoteDatum } from './noteDatum';

const DEFAULT_NOTE_PADDING = 10;
const ICON_HEIGHT = 20;
const ICON_WIDTH = 22;
const ICON_SPACING = 10;
const LABEL_OFFSET = ICON_HEIGHT + ICON_SPACING;
const TOOLBAR_OFFSET = 34;

export class NoteScene extends TextualPointScene<NoteDatum> {
    static override is(value: unknown): value is NoteScene {
        return AnnotationScene.isCheck(value, AnnotationType.Note);
    }

    type = AnnotationType.Note;

    protected override textPosition: 'top' | 'bottom' = 'bottom';
    protected override readonly textAlignment = 'center' as const;
    protected override readonly textWidth = 200;

    private readonly shape = new _ModuleSupport.Rect();
    private readonly iconBackground = new _ModuleSupport.TranslatableSvgPath(
        'M22 1.83333C22 0.820811 21.1792 0 20.1667 0H1.83333C0.820811 0 0 0.82081 0 1.83333V13.9868C0 14.9994 0.820811 15.8202 1.83333 15.8202L5.88971 15.8202C6.44575 15.8202 6.97175 16.0725 7.31971 16.5062L9.57006 19.3112C10.304 20.2259 11.6962 20.2259 12.4301 19.3112L14.6804 16.5062C15.0284 16.0725 15.5544 15.8202 16.1104 15.8202L20.1667 15.8202C21.1792 15.8202 22 14.9994 22 13.9868V1.83333Z'
    );
    private readonly iconLines = new _ModuleSupport.TranslatableSvgPath(
        'M17.1114 5.75C17.1114 6.16421 16.7756 6.5 16.3614 6.5H5.63916C5.22495 6.5 4.88916 6.16421 4.88916 5.75V5.75C4.88916 5.33579 5.22495 5 5.63916 5H16.3614C16.7756 5 17.1114 5.33579 17.1114 5.75V5.75ZM17.1114 9.25C17.1114 9.66421 16.7756 10 16.3614 10H5.63916C5.22495 10 4.88916 9.66421 4.88916 9.25V9.25C4.88916 8.83579 5.22495 8.5 5.63916 8.5H16.3614C16.7756 8.5 17.1114 8.83579 17.1114 9.25V9.25Z'
    );

    private active = false;

    constructor() {
        super();

        this.shape.visible = false;
        this.label.visible = false;

        this.iconBackground.fillShadow = {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.5)',
            xOffset: 0,
            yOffset: 0,
            blur: 5,
        };

        this.append([this.shape, this.label, this.iconBackground, this.iconLines, this.handle]);
    }

    override update(datum: NoteDatum, context: AnnotationContext): void {
        this.updateIcon(datum, context);
        super.update(datum, context);
    }

    override getTextBBox(datum: NoteDatum, coords: Point, context: AnnotationContext) {
        const { textWidth } = this;
        const bbox = super.getTextBBox(datum, coords, context);

        bbox.x -= textWidth / 2;
        bbox.x = clamp(0, bbox.x, context.seriesRect.width - textWidth);
        bbox.y = this.placeText(datum, bbox.y, bbox.height);

        return bbox;
    }

    protected override getTextInputCoords(datum: TextualPointDatum, context: AnnotationContext, height: number) {
        const { textWidth } = this;
        const coords = super.getTextInputCoords(datum, context, height);
        const bbox = getBBox(this.getTextOptions(datum), datum.text, coords);

        bbox.x = clamp(textWidth / 2, bbox.x, context.seriesRect.width - textWidth / 2);
        bbox.y = this.placeText(datum, bbox.y, Math.max(bbox.height, height));

        return { x: bbox.x, y: bbox.y };
    }

    // Flip the text above the icon when there is no room for it and the toolbar below.
    private placeText(datum: TextualPointDatum, y: number, textHeight: number) {
        const padding = this.getPadding(datum).top;
        const topY = y - LABEL_OFFSET - padding * 2;
        const bottomY = y + DivariantHandle.HANDLE_SIZE + padding * 2;

        if (topY - textHeight - TOOLBAR_OFFSET < 0) {
            this.textPosition = 'top';
            return bottomY;
        }

        this.textPosition = 'bottom';
        return topY + padding;
    }

    protected override getPadding(datum: TextualPointDatum): Padding {
        return uniformPadding(datum.padding ?? DEFAULT_NOTE_PADDING);
    }

    override updateLabel(datum: NoteDatum, bbox: BoxBounds, context: AnnotationContext): void {
        const labelVisibility = datum.visible === false ? false : this.label.visible;

        super.updateLabel(datum, bbox, context);

        if (context.isRtl) {
            this.label.x += this.textWidth - bbox.width;
        }

        this.label.visible = labelVisibility;
        this.label.text = wrapText(datum.text, {
            maxWidth: this.textWidth,
            font: datum,
            textWrap: 'always',
            avoidOrphans: false,
        });
    }

    override updateShape(datum: NoteDatum, bbox: BoxBounds) {
        const { shape } = this;
        shape.fill = datum.background.fill;
        shape.fillOpacity = datum.background.fillOpacity ?? 1;
        shape.stroke = datum.background.stroke;
        shape.strokeOpacity = datum.background.strokeOpacity ?? 1;
        shape.strokeWidth = datum.background.strokeWidth ?? 1;
        shape.cornerRadius = 4;

        const padding = this.getPadding(datum).top;
        const isPositionTop = this.textPosition === 'top';

        shape.x = bbox.x - padding;
        shape.width = this.textWidth + padding * 2;
        shape.height = bbox.height + padding * 2;
        shape.y = bbox.y + (isPositionTop ? 0 : -bbox.height) - padding;
    }

    private updateIcon(datum: NoteDatum, context: AnnotationContext) {
        const { active, iconBackground, iconLines } = this;
        const { x, y } = convertPoint(datum, context);

        iconBackground.translationX = x - ICON_WIDTH / 2;
        iconBackground.translationY = y - ICON_HEIGHT;

        iconLines.translationX = iconBackground.translationX;
        iconLines.translationY = iconBackground.translationY;

        iconBackground.fill = datum.fill;
        iconBackground.fillOpacity = datum.fillOpacity ?? 1;
        iconBackground.stroke = datum.stroke;
        iconBackground.strokeOpacity = datum.strokeOpacity ?? 1;
        iconBackground.strokeWidth = datum.strokeWidth ?? 1;

        iconLines.fill = datum.stroke;

        if (active) {
            iconBackground.fillShadow!.color = datum.fill ?? 'rgba(0, 0, 0, 0.22)';
        } else {
            iconBackground.fillShadow!.color = 'rgba(0, 0, 0, 0.22)';
        }
    }

    protected override updateAnchor(datum: NoteDatum, bbox: BoxBounds, context: AnnotationContext) {
        const padding = this.getPadding(datum).top;
        const isPositionTop = this.textPosition === 'top';
        const direction = isPositionTop ? 1 : -1;

        return {
            x: bbox.x + context.seriesRect.x + this.textWidth / 2,
            y: bbox.y + context.seriesRect.y + direction * (bbox.height + padding),
            position: isPositionTop ? ('below' as const) : ('above' as const),
        };
    }

    protected override getLabelCoords(datum: NoteDatum, bbox: BoxBounds): Point {
        const isPositionTop = this.textPosition === 'top';
        const padding = this.getPadding(datum).top + calcLineHeight(datum.fontSize, ANNOTATION_TEXT_LINE_HEIGHT) / 2;

        return { x: bbox.x, y: bbox.y + (isPositionTop ? padding / 2 : 0) };
    }

    protected override getTextBaseline(): CanvasTextBaseline {
        return this.textPosition === 'top' ? 'middle' : this.textPosition;
    }

    protected override getHandleCoords(_datum: NoteDatum, coords: Point, _bbox: BoxBounds): Point {
        return {
            x: coords.x,
            y: coords.y + DivariantHandle.HANDLE_SIZE / 2 + 4,
        };
    }

    protected override getHandleStyles(datum: NoteDatum) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.fill,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }

    override toggleHovered(hovered: boolean, active: boolean, readOnly: boolean | undefined) {
        super.toggleHovered(hovered, active, readOnly);

        const visible = hovered || (active && !readOnly);

        this.label.visible = visible;
        this.shape.visible = visible;

        this.zIndex = visible ? ZIndexMap.CHART_ANNOTATION_FOCUSED : ZIndexMap.CHART_ANNOTATION;
    }

    override toggleActive(active: boolean) {
        super.toggleActive(active);

        this.label.visible = active;
        this.shape.visible = active;

        this.active = active;
    }

    override containsPoint(x: number, y: number) {
        if (this.shape.visible && this.shape.containsPoint(x, y)) return true;
        if (this.iconBackground.containsPoint(x, y)) return true;

        return super.containsPoint(x, y);
    }
}
