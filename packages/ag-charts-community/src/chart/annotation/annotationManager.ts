import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';

export class AnnotationManager {
    constructor(private readonly annotationRoot: Group) {}

    public attachNode(node: Node) {
        this.annotationRoot.append(node);
        return () => {
            this.annotationRoot?.removeChild(node);
            return this;
        };
    }
}
