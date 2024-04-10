import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { isObject } from '../../util/type-guards';
import type { PlainObject } from '../../util/types';

export class AnnotationManager {
    private styles?: PlainObject;

    constructor(private readonly annotationRoot: Group) {}

    public attachNode(node: Node) {
        this.annotationRoot.append(node);
        return () => {
            this.annotationRoot?.removeChild(node);
            return this;
        };
    }

    public setAnnotationStyles(styles: any) {
        this.styles = isObject(styles) ? styles : {};
    }

    public getAnnotationTypeStyles(type: 'line' | 'parallel-channel') {
        const styles = this.styles?.[type];
        return isObject(styles) ? styles : undefined;
    }
}
