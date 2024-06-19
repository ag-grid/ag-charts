import type { AnnotationsMemento } from '../../chart/annotation/annotationManager';
import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { ActionOnSet } from '../../util/proxy';

export class InitialState extends BaseModuleInstance implements ModuleInstance {
    @ActionOnSet<InitialState>({
        newValue(annotations: AnnotationsMemento) {
            this.ctx.stateManager.setState(this.ctx.annotationManager, annotations);
        },
    })
    annotations?: AnnotationsMemento;

    constructor(private readonly ctx: ModuleContext) {
        super();
    }
}
