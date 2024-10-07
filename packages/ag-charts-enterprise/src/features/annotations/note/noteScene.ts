import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { TextualPointScene } from '../scenes/textualPointScene';
import { convertPoint } from '../utils/values';
import { ICON_HEIGHT, ICON_WIDTH, LABEL_OFFSET, type NoteProperties, TOOLBAR_OFFSET } from './noteProperties';

const { ZIndexMap, TextWrapper } = _ModuleSupport;
const { clamp } = _Util;

export class NoteScene extends TextualPointScene<NoteProperties> {
    static override is(value: unknown): value is NoteScene {
        return AnnotationScene.isCheck(value, AnnotationType.Note);
    }

    override type = AnnotationType.Note;

    private readonly shape = new _Scene.Rect();
    private readonly iconBackground = new _Scene.SvgPath(
        'M22 1.83333C22 0.820811 21.1792 0 20.1667 0H1.83333C0.820811 0 0 0.82081 0 1.83333V13.9868C0 14.9994 0.820811 15.8202 1.83333 15.8202L5.88971 15.8202C6.44575 15.8202 6.97175 16.0725 7.31971 16.5062L9.57006 19.3112C10.304 20.2259 11.6962 20.2259 12.4301 19.3112L14.6804 16.5062C15.0284 16.0725 15.5544 15.8202 16.1104 15.8202L20.1667 15.8202C21.1792 15.8202 22 14.9994 22 13.9868V1.83333Z'
    );
    private readonly iconLines = new _Scene.SvgPath(
        'M17.1114 5.75C17.1114 6.16421 16.7756 6.5 16.3614 6.5H5.63916C5.22495 6.5 4.88916 6.16421 4.88916 5.75V5.75C4.88916 5.33579 5.22495 5 5.63916 5H16.3614C16.7756 5 17.1114 5.33579 17.1114 5.75V5.75ZM17.1114 9.25C17.1114 9.66421 16.7756 10 16.3614 10H5.63916C5.22495 10 4.88916 9.66421 4.88916 9.25V9.25C4.88916 8.83579 5.22495 8.5 5.63916 8.5H16.3614C16.7756 8.5 17.1114 8.83579 17.1114 9.25V9.25Z'
    );

    private active = false;

    constructor() {
        super();

        this.shape.visible = false;
        this.label.visible = false;

        this.iconBackground.fillShadow = new _Scene.DropShadow();

        this.append([this.shape, this.label, this.iconBackground, this.iconLines, this.handle]);
    }

    override update(datum: NoteProperties, context: AnnotationContext): void {
        this.updateIcon(datum, context);
        super.update(datum, context);
    }

    override getTextBBox(datum: NoteProperties, coords: _Util.Vec2, context: AnnotationContext) {
        const bbox = super.getTextBBox(datum, coords, context);

        const { seriesRect } = context;

        bbox.x -= datum.width / 2;
        bbox.x = clamp(0, bbox.x, seriesRect.width - datum.width);

        const padding = datum.getPadding().top;
        const topY = bbox.y - LABEL_OFFSET - padding * 2;
        const bottomY = bbox.y + DivariantHandle.HANDLE_SIZE + padding * 2;

        if (topY - bbox.height - TOOLBAR_OFFSET < seriesRect.y) {
            bbox.y = bottomY;
            datum.position = 'top';
        } else {
            bbox.y = topY + padding;
            datum.position = 'bottom';
        }

        return bbox;
    }

    override updateLabel(datum: NoteProperties, bbox: _Scene.BBox): void {
        const labelVisibility = datum.visible === false ? false : this.label.visible;

        super.updateLabel(datum, bbox);

        this.label.visible = labelVisibility;
        this.label.text = TextWrapper.wrapText(datum.text, {
            font: {
                fontFamily: datum.fontFamily,
                fontSize: datum.fontSize,
                fontStyle: datum.fontStyle,
                fontWeight: datum.fontWeight,
            },
            avoidOrphans: false,
            textAlign: datum.textAlign,
            textBaseline: 'hanging',
            textWrap: 'always',
            maxWidth: 200,
        });
    }

    override updateShape(datum: NoteProperties, bbox: _Scene.BBox) {
        const { shape } = this;
        shape.fill = datum.background.fill;
        shape.fillOpacity = datum.background.fillOpacity ?? 1;
        shape.stroke = datum.background.stroke;
        shape.strokeOpacity = datum.background.strokeOpacity ?? 1;
        shape.strokeWidth = datum.background.strokeWidth ?? 1;
        shape.cornerRadius = 4;

        const padding = datum.getPadding().top;
        const isPositionTop = datum.position === 'top';

        shape.x = bbox.x - padding;
        shape.width = datum.width + padding * 2;
        shape.height = bbox.height + padding * 2;
        shape.y = bbox.y + (isPositionTop ? 0 : -bbox.height) - padding;
    }

    private updateIcon(datum: NoteProperties, context: AnnotationContext) {
        const { active, iconBackground, iconLines } = this;
        const { x, y } = convertPoint(datum, context);

        iconBackground.x = x - ICON_WIDTH / 2;
        iconBackground.y = y - ICON_HEIGHT;

        iconLines.x = iconBackground.x;
        iconLines.y = iconBackground.y;

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

    protected override updateAnchor(datum: NoteProperties, bbox: _Scene.BBox, context: AnnotationContext) {
        const padding = datum.getPadding().top;
        const isPositionTop = datum.position === 'top';
        const direction = isPositionTop ? 1 : -1;

        return {
            x: bbox.x + context.seriesRect.x + datum.width / 2,
            y: bbox.y + context.seriesRect.y + direction * (bbox.height + padding),
            position: isPositionTop ? ('below' as const) : ('above' as const),
        };
    }

    protected override getHandleCoords(_datum: NoteProperties, coords: _Util.Vec2, _bbox: _Scene.BBox): _Util.Vec2 {
        return {
            x: coords.x,
            y: coords.y + DivariantHandle.HANDLE_SIZE / 2 + 4,
        };
    }

    protected override getHandleStyles(datum: NoteProperties) {
        return {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.fill,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };
    }

    override toggleHovered(hovered: boolean) {
        super.toggleHovered(hovered);

        this.label.visible = hovered;
        this.shape.visible = hovered;

        this.zIndex = hovered ? ZIndexMap.CHART_ANNOTATION_FOCUSED : ZIndexMap.CHART_ANNOTATION;
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
