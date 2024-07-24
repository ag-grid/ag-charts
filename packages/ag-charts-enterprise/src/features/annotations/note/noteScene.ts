import { _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from '../annotationTypes';
import { convertPoint } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
// import { DivariantHandle } from '../scenes/handle';
import { TextualPointScene } from '../scenes/textualPointScene';
import type { NoteProperties } from './noteProperties';

export class NoteScene extends TextualPointScene<NoteProperties> {
    static override is(value: unknown): value is NoteScene {
        return AnnotationScene.isCheck(value, AnnotationType.Note);
    }

    override type = AnnotationType.Note;

    private readonly shape = new _Scene.Rect();
    private readonly iconBackgound = new _Scene.Rect();
    // private readonly iconBackgound = new _Scene.SvgPath(
    //     'M22 1.83333C22 0.820811 21.1792 0 20.1667 0H1.83333C0.820811 0 0 0.82081 0 1.83333V13.9868C0 14.9994 0.820811 15.8202 1.83333 15.8202L5.88971 15.8202C6.44575 15.8202 6.97175 16.0725 7.31971 16.5062L9.57006 19.3112C10.304 20.2259 11.6962 20.2259 12.4301 19.3112L14.6804 16.5062C15.0284 16.0725 15.5544 15.8202 16.1104 15.8202L20.1667 15.8202C21.1792 15.8202 22 14.9994 22 13.9868V1.83333Z'
    // );
    // private readonly iconLines = new _Scene.SvgPath(
    //     'M17.1114 5.75C17.1114 6.16421 16.7756 6.5 16.3614 6.5H5.63916C5.22495 6.5 4.88916 6.16421 4.88916 5.75V5.75C4.88916 5.33579 5.22495 5 5.63916 5H16.3614C16.7756 5 17.1114 5.33579 17.1114 5.75V5.75ZM17.1114 9.25C17.1114 9.66421 16.7756 10 16.3614 10H5.63916C5.22495 10 4.88916 9.66421 4.88916 9.25V9.25C4.88916 8.83579 5.22495 8.5 5.63916 8.5H16.3614C16.7756 8.5 17.1114 8.83579 17.1114 9.25V9.25Z'
    // );

    constructor() {
        super();
        this.append([this.shape, this.label, /* this.iconLines,*/ this.iconBackgound, this.handle]);
    }

    override update(datum: NoteProperties, context: AnnotationContext): void {
        // super.update(datum, context);

        this.updateIcon(datum, context);

        // const { x, y } = convertPoint(datum, context);

        const textBBox = new _Scene.BBox(this.shape.x, this.shape.y, this.shape.width, 0);
        super.updateLabel(datum, textBBox);
        super.updateHandle(datum, textBBox);

        // const styles = {
        //     fill: datum.handle.fill,
        //     stroke: datum.handle.stroke ?? datum.color,
        //     strokeOpacity: datum.handle.strokeOpacity,
        //     strokeWidth: datum.handle.strokeWidth,
        // };

        // this.handle.update({ ...styles, x, y: y + DivariantHandle.HANDLE_SIZE / 2 });
        // this.handle.toggleLocked(datum.locked ?? false);
    }

    // protected override updateShape(_datum: NoteProperties) {
    //     this.shape
    // }

    override updateHandle(_datum: NoteProperties, _textBBox: _Scene.BBox): void {
        //
    }

    private updateIcon(datum: NoteProperties, context: AnnotationContext) {
        const { x, y } = convertPoint(datum, context);

        // const textBBox = datum.getTextBBox(context);

        this.shape.fill = 'grey';
        this.shape.x = x - 220 / 2;
        this.shape.y = y - this.iconBackgound.height - 100 - 10;
        this.shape.width = 220;
        this.shape.height = 100;

        this.iconBackgound.width = 22;
        this.iconBackgound.height = 20;
        this.iconBackgound.x = x - this.iconBackgound.width / 2;
        this.iconBackgound.y = y - this.iconBackgound.height;
    }

    override getAnchor() {
        const bbox = this.getCachedBBoxWithoutHandles();
        return { x: bbox.x + bbox.width / 2, y: bbox.y };
    }
}

// <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path fill-rule="evenodd" clip-rule="evenodd" d="M22 1.83333C22 0.820811 21.1792 0 20.1667 0H1.83333C0.820811 0 0 0.82081 0 1.83333V13.9868C0 14.9994 0.820811 15.8202 1.83333 15.8202L5.88971 15.8202C6.44575 15.8202 6.97175 16.0725 7.31971 16.5062L9.57006 19.3112C10.304 20.2259 11.6962 20.2259 12.4301 19.3112L14.6804 16.5062C15.0284 16.0725 15.5544 15.8202 16.1104 15.8202L20.1667 15.8202C21.1792 15.8202 22 14.9994 22 13.9868V1.83333Z" fill="#5090DC"/>
// <path fill-rule="evenodd" clip-rule="evenodd" d="M17.1114 5.75C17.1114 6.16421 16.7756 6.5 16.3614 6.5H5.63916C5.22495 6.5 4.88916 6.16421 4.88916 5.75V5.75C4.88916 5.33579 5.22495 5 5.63916 5H16.3614C16.7756 5 17.1114 5.33579 17.1114 5.75V5.75ZM17.1114 9.25C17.1114 9.66421 16.7756 10 16.3614 10H5.63916C5.22495 10 4.88916 9.66421 4.88916 9.25V9.25C4.88916 8.83579 5.22495 8.5 5.63916 8.5H16.3614C16.7756 8.5 17.1114 8.83579 17.1114 9.25V9.25Z" fill="white"/>
// </svg>
