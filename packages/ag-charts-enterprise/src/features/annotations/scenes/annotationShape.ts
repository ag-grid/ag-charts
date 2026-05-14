import { _ModuleSupport } from 'ag-charts-community';

export class AnnotationShape extends _ModuleSupport.Marker {
    // Annotation handles read position as `x`/`y`; Marker now positions via `translationX/Y`,
    // so keep the legacy field names alive here to avoid leaking marker internals to the
    // annotation handle infrastructure.
    get x(): number {
        return this.translationX;
    }
    set x(value: number) {
        this.translationX = value;
    }
    get y(): number {
        return this.translationY;
    }
    set y(value: number) {
        this.translationY = value;
    }

    // Use exact path-based hit-test rather than the Marker's analytical bounding-circle
    // approximation. Input coordinates are in this node's local (origin-centred) space because
    // `MatrixTransform.pickNode` inverse-transforms parent-space points before delegating here.
    override isPointInPath(x: number, y: number): boolean {
        this.updatePathIfDirty();
        const sharedPath = this._sharedPath;
        return sharedPath != null && sharedPath.closedPath && sharedPath.isPointInPath(x, y);
    }
}
