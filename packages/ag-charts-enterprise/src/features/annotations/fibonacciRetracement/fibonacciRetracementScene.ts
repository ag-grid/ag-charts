import { _ModuleSupport } from 'ag-charts-community';

import { AnnotationScene } from '../scenes/annotationScene';
import { FibonacciScene } from '../scenes/fibonacciScene';
import type { FibonacciRetracementProperties } from './fibonacciRetracementProperties';

export class FibonacciRetracementScene extends FibonacciScene<FibonacciRetracementProperties> {
    static override is(value: unknown): value is FibonacciRetracementScene {
        return AnnotationScene.isCheck(value, 'fibonacci-retracement');
    }

    type = 'fibonacci-retracement';

    constructor() {
        super();
        this.append([this.start, this.end]);
    }
}
