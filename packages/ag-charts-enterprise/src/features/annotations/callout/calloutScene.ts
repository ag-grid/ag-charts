import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualStartEndScene } from '../scenes/textualStartEndScene';
import type { CalloutProperties } from './calloutProperties';

export class CalloutScene extends TextualStartEndScene<CalloutProperties> {
    static override is(value: unknown): value is CalloutScene {
        return AnnotationScene.isCheck(value, AnnotationType.Callout);
    }

    override type = AnnotationType.Callout;

    constructor() {
        super();
        this.append([this.label, this.start, this.end]);
    }

    protected override updateShape(_datum: CalloutProperties) {
        // TODO
    }
}
