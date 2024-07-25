import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import { TextualPointScene } from '../scenes/textualPointScene';
import type { NoteProperties } from './noteProperties';

export const DEFAULT_PADDING = 10;
const ICON_HEIGHT = 20;
const ICON_WIDTH = 22;
const ICON_SPACING = 10;
export const LABEL_OFFSET = ICON_HEIGHT + ICON_SPACING;

const { TextWrapper } = _ModuleSupport;

export class NoteScene extends TextualPointScene<NoteProperties> {
    static override is(value: unknown): value is NoteScene {
        return AnnotationScene.isCheck(value, AnnotationType.Note);
    }

    override type = AnnotationType.Note;

    private readonly shape = new _Scene.Rect();
    // private readonly iconBackgound = new _Scene.Rect();
    private readonly iconBackgound = new _Scene.SvgPath(
        'M22 1.83333C22 0.820811 21.1792 0 20.1667 0H1.83333C0.820811 0 0 0.82081 0 1.83333V13.9868C0 14.9994 0.820811 15.8202 1.83333 15.8202L5.88971 15.8202C6.44575 15.8202 6.97175 16.0725 7.31971 16.5062L9.57006 19.3112C10.304 20.2259 11.6962 20.2259 12.4301 19.3112L14.6804 16.5062C15.0284 16.0725 15.5544 15.8202 16.1104 15.8202L20.1667 15.8202C21.1792 15.8202 22 14.9994 22 13.9868V1.83333Z'
    );
    private readonly iconLines = new _Scene.SvgPath(
        'M17.1114 5.75C17.1114 6.16421 16.7756 6.5 16.3614 6.5H5.63916C5.22495 6.5 4.88916 6.16421 4.88916 5.75V5.75C4.88916 5.33579 5.22495 5 5.63916 5H16.3614C16.7756 5 17.1114 5.33579 17.1114 5.75V5.75ZM17.1114 9.25C17.1114 9.66421 16.7756 10 16.3614 10H5.63916C5.22495 10 4.88916 9.66421 4.88916 9.25V9.25C4.88916 8.83579 5.22495 8.5 5.63916 8.5H16.3614C16.7756 8.5 17.1114 8.83579 17.1114 9.25V9.25Z'
    );
    private padding = DEFAULT_PADDING;

    private active = false;

    constructor() {
        super();

        this.shape.visible = false;
        this.label.visible = false;

        this.iconBackgound.fillShadow = new _Scene.DropShadow();

        this.append([this.shape, this.label, this.iconLines, this.iconBackgound, this.handle]);
    }

    override update(datum: NoteProperties, context: AnnotationContext): void {
        this.padding = datum.padding ?? DEFAULT_PADDING;

        this.updateIcon(datum, context);
        super.update(datum, context);
    }

    override updateLabel(datum: NoteProperties, bbox: _Scene.BBox): void {
        super.updateLabel(datum, bbox);

        const textLines = TextWrapper.wrapLines(datum.text, {
            font: {
                fontFamily: datum.fontFamily,
                fontSize: datum.fontSize,
                fontStyle: datum.fontStyle,
                fontWeight: datum.fontWeight,
            },
            textAlign: datum.textAlign,
            maxWidth: 200,
        });
        const wrappedText = textLines.join('\n');

        this.label.text = wrappedText;
    }

    override updateShape(datum: NoteProperties, bbox: _Scene.BBox) {
        const { shape } = this;

        const padding = datum.padding ?? DEFAULT_PADDING;

        shape.fill = datum.background.fill;
        shape.fillOpacity = datum.background.fillOpacity ?? 1;
        shape.stroke = datum.background.stroke;
        shape.strokeOpacity = datum.background.strokeOpacity ?? 1;
        shape.strokeWidth = datum.background.strokeWidth ?? 1;
        shape.cornerRadius = 4;

        shape.x = bbox.x - datum.width / 2 - padding;
        shape.width = datum.width + padding * 2;
        shape.height = bbox.height + padding * 2;
        shape.y = bbox.y - shape.height - LABEL_OFFSET;
    }

    private updateIcon(datum: NoteProperties, context: AnnotationContext) {
        const { active, iconBackgound, iconLines } = this;
        const { x, y } = convertPoint(datum, context);

        iconBackgound.x = x - ICON_WIDTH / 2;
        iconBackgound.y = y - ICON_HEIGHT;

        iconLines.x = iconBackgound.x;
        iconLines.y = iconBackgound.y;

        iconBackgound.fill = datum.fill;
        iconBackgound.stroke = datum.stroke;
        iconBackgound.strokeOpacity = datum.strokeOpacity ?? 1;
        iconBackgound.strokeWidth = datum.strokeWidth ?? 1;

        iconLines.fill = datum.stroke;

        if (active) {
            iconBackgound.fillShadow!.color = datum.fill ?? 'rgba(0, 0, 0, 0.22)';
        } else {
            iconBackgound.fillShadow!.color = 'rgba(0, 0, 0, 0.22)';
        }
    }

    protected override updateAnchor(datum: NoteProperties, bbox: _Scene.BBox, context: AnnotationContext) {
        const anchor = super.updateAnchor(datum, bbox, context);
        return {
            x: anchor.x,
            y: anchor.y - this.padding * 2 - LABEL_OFFSET,
            position: 'above' as const,
        };
    }

    protected override getLabelCoords(datum: NoteProperties, bbox: _Scene.BBox): _Util.Vec2 {
        const padding = datum.padding ?? DEFAULT_PADDING;

        return {
            x: bbox.x - bbox.width / 2,
            y: bbox.y - LABEL_OFFSET - padding,
        };
    }

    protected override getHandleCoords(_datum: NoteProperties, bbox: _Scene.BBox): _Util.Vec2 {
        return {
            x: bbox.x,
            y: bbox.y + DivariantHandle.HANDLE_SIZE / 2 + 4,
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

    override toggleHandles(show: boolean | Partial<Record<'handle', boolean>>): void {
        super.toggleHandles(show);

        this.label.visible = Boolean(show);
        this.shape.visible = Boolean(show);
    }

    override toggleActive(active: boolean): void {
        super.toggleActive(active);

        this.label.visible = active;
        this.label.opacity = active ? 1 : 0;
        this.shape.visible = active;

        this.active = active;
    }

    override containsPoint(x: number, y: number) {
        if (this.shape.containsPoint(x, y)) return true;
        if (this.iconBackgound.containsPoint(x, y)) return true;

        return super.containsPoint(x, y);
    }
}
