import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { Point } from './annotationTypes';
import { AnnotationType } from './annotationTypes';
import type { AnnotationProperties } from './annotationsConfig';
import { CrossLineStateMachine } from './cross-line/crossLineState';
import { DisjointChannelStateMachine } from './disjoint-channel/disjointChannelState';
import { LineStateMachine } from './line/lineState';
import { ParallelChannelStateMachine } from './parallel-channel/parallelChannelState';
import { TextStateMachine } from './text/textState';

const { StateMachine } = _ModuleSupport;

type AnnotationEvent = 'click' | 'hover' | 'drag' | 'input' | 'cancel';

export class AnnotationsStateMachine extends StateMachine<'idle', AnnotationType | AnnotationEvent> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        onEnterIdle: () => void,
        appendDatum: (type: AnnotationType, datum: AnnotationProperties) => void,
        onExitSingleClick: () => void,
        validateChildStateDatumPoint: (point: Point) => boolean,
        showTextInput: () => void,
        hideTextInput: () => void
    ) {
        super('idle', {
            idle: {
                onEnter: () => onEnterIdle(),

                // Lines
                [AnnotationType.Line]: new LineStateMachine((datum) => appendDatum(AnnotationType.Line, datum)),
                [AnnotationType.HorizontalLine]: new CrossLineStateMachine(
                    'horizontal',
                    (datum) => appendDatum(AnnotationType.HorizontalLine, datum),
                    onExitSingleClick
                ),
                [AnnotationType.VerticalLine]: new CrossLineStateMachine(
                    'vertical',
                    (datum) => appendDatum(AnnotationType.VerticalLine, datum),
                    onExitSingleClick
                ),

                // Channels
                [AnnotationType.DisjointChannel]: new DisjointChannelStateMachine(
                    (datum) => appendDatum(AnnotationType.DisjointChannel, datum),
                    validateChildStateDatumPoint
                ),
                [AnnotationType.ParallelChannel]: new ParallelChannelStateMachine(
                    (datum) => appendDatum(AnnotationType.ParallelChannel, datum),
                    validateChildStateDatumPoint
                ),

                // Texts
                [AnnotationType.Text]: new TextStateMachine(
                    (datum) => appendDatum(AnnotationType.Text, datum),
                    onExitSingleClick,
                    showTextInput,
                    hideTextInput
                ),
            },
        });
    }
}
