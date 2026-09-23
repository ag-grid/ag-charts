import type { DynamicContext, MementoOriginator, OptionsDefs } from 'ag-charts-core';
import { deepClone, isArray, isObject, isPlainObject, mergeDefaults, validate } from 'ag-charts-core';
import type { AgAnnotation, AgAnnotationsThemeableOptions } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import type { Node } from '../../scene/node';

type AnnotationsMemento = AgAnnotation[];

export class AnnotationManager implements MementoOriginator<AnnotationsMemento> {
    public mementoOriginatorKey = 'annotations' as const;

    private annotations: AnnotationsMemento = [];
    private styles?: AgAnnotationsThemeableOptions;

    constructor(
        private readonly ctx: DynamicContext<ChartRegistry>,
        private readonly stateDefs: OptionsDefs<AgAnnotation>
    ) {}

    public createMemento() {
        return this.annotations;
    }

    public guardMemento(blob: unknown): blob is AnnotationsMemento | undefined {
        return blob == null || isArray(blob);
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: AnnotationsMemento | undefined) {
        // Migration from older versions can be implemented here.

        this.annotations = this.validateAnnotations(this.cleanData(deleteNulls(memento ?? []))).map((annotation) => {
            const annotationTheme = this.getAnnotationTypeStyles(annotation.type);
            return mergeDefaults(annotation, annotationTheme);
        });

        this.ctx.eventsHub.emit('annotations:restore', { annotations: this.annotations });
    }

    public updateData(annotations?: AnnotationsMemento) {
        this.annotations = this.cleanData(annotations ?? []);
    }

    public fireChangedEvent() {
        this.ctx.chartService.callListener({ type: 'annotations', annotations: deepClone([...this.annotations]) });
    }

    public attachNode(node: Node) {
        this.ctx.annotationRoot.append(node);
        return () => {
            node.remove();
            return this;
        };
    }

    public setAnnotationStyles(styles: AgAnnotationsThemeableOptions) {
        this.styles = styles;
    }

    public getAnnotationTypeStyles(
        type: keyof Omit<
            AgAnnotationsThemeableOptions,
            'axesButtons' | 'enabled' | 'optionsToolbar' | 'toolbar' | 'snap'
        >
    ) {
        return this.styles?.[type];
    }

    private validateAnnotations(annotations: AnnotationsMemento) {
        const params = { logger: this.ctx.logger };
        const valid: AnnotationsMemento = [];
        for (const [index, annotation] of annotations.entries()) {
            const { cleared, invalid } = validate(annotation, this.stateDefs, `annotations[${index}]`, params);
            for (const error of invalid) {
                this.ctx.logger.warn(error);
            }
            if (cleared?.type != null) {
                valid.push(cleared as AgAnnotation);
            }
        }
        return valid;
    }

    private cleanData(annotations: AnnotationsMemento) {
        // Strip text align from annotations as this is fixed by annotation type
        for (const annotation of annotations) {
            if (isObject(annotation) && 'textAlign' in annotation) {
                delete annotation.textAlign;
            }
        }
        return annotations;
    }
}

// A null in restored state unsets the field, so it falls back to its default rather than failing validation.
function deleteNulls<T>(value: T): T {
    if (isArray(value)) {
        for (const item of value) {
            deleteNulls(item);
        }
    } else if (isPlainObject(value)) {
        for (const key of Object.keys(value)) {
            if (value[key] === null) {
                delete value[key];
            } else {
                deleteNulls(value[key]);
            }
        }
    }
    return value;
}
