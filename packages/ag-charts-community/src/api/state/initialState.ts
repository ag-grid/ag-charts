import type { AnnotationsMemento } from '../../chart/annotation/annotationManager';
import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { ActionOnSet } from '../../util/proxy';
import { VERSION } from '../../version';
import { MementoCaretaker } from './memento';

export class InitialState extends BaseModuleInstance implements ModuleInstance {
    @ActionOnSet<InitialState>({
        newValue(annotations: AnnotationsMemento) {
            const {
                caretaker,
                ctx: { annotationManager },
            } = this;

            caretaker.restore({ version: caretaker.version, annotations }, annotationManager);
        },
    })
    annotations?: AnnotationsMemento;

    private readonly caretaker = new MementoCaretaker(VERSION);

    constructor(private readonly ctx: ModuleContext) {
        super();
    }
}
