import { _ModuleSupport } from 'ag-charts-community';

import { LineTextProperties } from '../annotationProperties';
import { LineTypeProperties } from '../line/lineProperties';

const { OBJECT, BOOLEAN, Validate } = _ModuleSupport;

export class FibonacciProperties extends LineTypeProperties {
    @Validate(OBJECT, { optional: true })
    label = new LineTextProperties();

    @Validate(BOOLEAN, { optional: true })
    reverse: boolean = false;
}
