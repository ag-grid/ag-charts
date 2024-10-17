import type { BBox } from './bbox';
import { IDENTITY_MATRIX_ELEMENTS, Matrix } from './matrix';
import { Node, RedrawType, type RenderContext, SceneChangeDetection } from './node';

type Constructor<T> = new (...args: any[]) => T;

interface LocalToParentCoordinateSpaceTransforms {
    /** Apply local node transforms to the given BBox. */
    toParent(bbox: BBox): BBox;
    /** Apply local node transforms to the given point. */
    toParentPoint(x: number, y: number): { x: number; y: number };
}

interface ParentToLocalCoordinateSpaceTransforms {
    /** Apply local node inverse transforms to the given BBox. */
    fromParent(bbox: BBox): BBox;
    /** Apply local node inverse transforms to the given point. */
    fromParentPoint(x: number, y: number): { x: number; y: number };
}

type MatrixTransformType<T> = T &
    LocalToParentCoordinateSpaceTransforms &
    ParentToLocalCoordinateSpaceTransforms & {
        updateMatrix(matrix: Matrix): void;
        computeBBoxWithoutTransforms(): BBox | undefined;
    };

export function isMatrixTransform<N extends Node>(node: N): node is MatrixTransformType<N> {
    return isMatrixTransformType(node.constructor as any);
}

const MATRIX_TRANSFORM_TYPE = Symbol('isMatrixTransform');
function isMatrixTransformType<N extends Node>(cstr: Constructor<N>): cstr is Constructor<MatrixTransformType<N>> {
    return (cstr as any)[MATRIX_TRANSFORM_TYPE] === true;
}

/**
 * Base mixin type for operations that require matrix calculations.
 *
 * Only intended for use by concrete mixin types below.
 */
function MatrixTransform<N extends Node>(Parent: Constructor<N>) {
    const ParentNode = Parent as Constructor<Node>;

    // Make sure we don't mixin `MatrixTransformInternal` multiple times.
    if (isMatrixTransformType(Parent)) {
        return Parent as unknown as Constructor<MatrixTransformType<N>>;
    }

    const TRANSFORM_MATRIX = Symbol('matrix_combined_transform');
    class MatrixTransformInternal extends ParentNode implements MatrixTransformType<Node> {
        public static readonly [MATRIX_TRANSFORM_TYPE] = true;
        private [TRANSFORM_MATRIX] = new Matrix();

        private _dirtyTransform = true;
        markDirtyTransform() {
            this._dirtyTransform = true;
            super.markDirty(RedrawType.MAJOR);
        }

        updateMatrix(_matrix: Matrix) {
            // For override by sub-classes.
        }

        computeTransformMatrix() {
            if (!this._dirtyTransform) return;

            // Need to force parent re-calculation as we modify the matrix in place.
            this[TRANSFORM_MATRIX].setElements(IDENTITY_MATRIX_ELEMENTS);
            this.updateMatrix(this[TRANSFORM_MATRIX]);
            this._dirtyTransform = false;
        }

        toParent(bbox: BBox) {
            this.computeTransformMatrix();
            if (this[TRANSFORM_MATRIX].identity) return bbox.clone();
            return this[TRANSFORM_MATRIX].transformBBox(bbox);
        }

        toParentPoint(x: number, y: number) {
            this.computeTransformMatrix();
            if (this[TRANSFORM_MATRIX].identity) return { x, y };
            return this[TRANSFORM_MATRIX].transformPoint(x, y);
        }

        fromParent(bbox: BBox) {
            this.computeTransformMatrix();
            if (this[TRANSFORM_MATRIX].identity) return bbox.clone();
            return this[TRANSFORM_MATRIX].inverse().transformBBox(bbox);
        }

        fromParentPoint(x: number, y: number) {
            this.computeTransformMatrix();
            if (this[TRANSFORM_MATRIX].identity) return { x, y };
            return this[TRANSFORM_MATRIX].inverse().transformPoint(x, y);
        }

        override computeBBox() {
            const bbox = super.computeBBox();
            if (!bbox) return bbox;

            return this.toParent(bbox);
        }

        computeBBoxWithoutTransforms() {
            return super.computeBBox();
        }

        override pickNode(x: number, y: number, localCoords = false) {
            if (!localCoords) {
                ({ x, y } = this.fromParentPoint(x, y));
            }

            return super.pickNode(x, y);
        }

        override render(renderCtx: RenderContext): void {
            if (this._dirtyTransform) {
                this.computeTransformMatrix();
                if (!renderCtx.forceRender) {
                    renderCtx = { ...renderCtx, forceRender: 'dirtyTransform' };
                }
            }

            const matrix = this[TRANSFORM_MATRIX];
            let performRestore = false;
            if (!matrix.identity) {
                renderCtx.ctx.save();
                performRestore = true;
                matrix.toContext(renderCtx.ctx);
            }

            super.render(renderCtx);

            if (performRestore) {
                renderCtx.ctx.restore();
            }
        }

        override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
            const svg = super.toSVG();

            const matrix = this[TRANSFORM_MATRIX];
            if (matrix.identity || svg == null) return svg;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.append(...svg.elements);

            const [a, b, c, d, e, f] = matrix.e;
            g.setAttribute('transform', `matrix(${a} ${b} ${c} ${d} ${e} ${f})`);

            return {
                elements: [g],
                defs: svg.defs,
            };
        }
    }
    return MatrixTransformInternal as unknown as Constructor<MatrixTransformType<N>>;
}

export type RotatableType<T> = MatrixTransformType<
    T & {
        rotationCenterX: number | null;
        rotationCenterY: number | null;
        rotation: number;
    }
>;

/** Mixin type for scene Nodes that are rotatable. */
export function Rotatable<N extends Node>(Parent: Constructor<N>): Constructor<RotatableType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    const ROTATABLE_MATRIX = Symbol('matrix_rotation');
    class RotatableInternal extends MatrixTransform(ParentNode) {
        [ROTATABLE_MATRIX] = new Matrix();

        @SceneChangeDetection({ type: 'transform' })
        rotationCenterX: number | null = null;
        @SceneChangeDetection({ type: 'transform' })
        rotationCenterY: number | null = null;
        @SceneChangeDetection({ type: 'transform' })
        rotation: number = 0;

        override updateMatrix(matrix: Matrix) {
            super.updateMatrix(matrix);

            const { rotation, rotationCenterX, rotationCenterY } = this;
            if (rotation === 0) return;

            Matrix.updateTransformMatrix(this[ROTATABLE_MATRIX], 1, 1, rotation, 0, 0, {
                rotationCenterX,
                rotationCenterY,
            });

            matrix.multiplySelf(this[ROTATABLE_MATRIX]);
        }
    }
    return RotatableInternal as unknown as Constructor<RotatableType<N>>;
}

export type ScalableType<T> = MatrixTransformType<
    T & {
        scalingX: number;
        scalingY: number;
        scalingCenterX: number | null;
        scalingCenterY: number | null;
    }
>;

/** Mixin type for scene Nodes that are scalable. */
export function Scalable<N extends Node>(Parent: Constructor<N>): Constructor<ScalableType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    const SCALABLE_MATRIX = Symbol('matrix_scale');
    class ScalableInternal extends MatrixTransform(ParentNode) {
        [SCALABLE_MATRIX] = new Matrix();

        @SceneChangeDetection({ type: 'transform' })
        scalingX: number = 1;
        @SceneChangeDetection({ type: 'transform' })
        scalingY: number = 1;
        @SceneChangeDetection({ type: 'transform' })
        scalingCenterX: number | null = null;
        @SceneChangeDetection({ type: 'transform' })
        scalingCenterY: number | null = null;

        override updateMatrix(matrix: Matrix) {
            super.updateMatrix(matrix);

            const { scalingX, scalingY, scalingCenterX, scalingCenterY } = this;
            if (scalingX === 1 && scalingY === 1) return;

            Matrix.updateTransformMatrix(this[SCALABLE_MATRIX], scalingX, scalingY, 0, 0, 0, {
                scalingCenterX,
                scalingCenterY,
            });

            matrix.multiplySelf(this[SCALABLE_MATRIX]);
        }
    }
    return ScalableInternal as unknown as Constructor<ScalableType<N>>;
}

export type TranslatableType<T> = MatrixTransformType<
    T & {
        translationX: number;
        translationY: number;
    }
>;

/** Mixin type for scene Nodes that are translatable. */
export function Translatable<N extends Node>(Parent: Constructor<N>): Constructor<TranslatableType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    const TRANSLATABLE_MATRIX = Symbol('matrix_translation');
    class TranslatableInternal extends MatrixTransform(ParentNode) {
        [TRANSLATABLE_MATRIX] = new Matrix();

        @SceneChangeDetection({ type: 'transform' })
        translationX: number = 0;
        @SceneChangeDetection({ type: 'transform' })
        translationY: number = 0;

        override updateMatrix(matrix: Matrix) {
            super.updateMatrix(matrix);

            const { translationX, translationY } = this;
            if (translationX === 0 && translationY === 0) return;

            Matrix.updateTransformMatrix(this[TRANSLATABLE_MATRIX], 1, 1, 0, translationX, translationY);

            matrix.multiplySelf(this[TRANSLATABLE_MATRIX]);
        }
    }
    return TranslatableInternal as unknown as Constructor<TranslatableType<N>>;
}

/** Utility class for operations relating to matrix-transformable mixin types. */
export class Transformable {
    /**
     * Converts a BBox from canvas coordinate space into the coordinate space of the given Node.
     */
    static fromCanvas(node: Node, bbox: BBox) {
        const parents = [];
        for (const parent of node.traverseUp()) {
            if (isMatrixTransform(parent)) {
                parents.unshift(parent);
            }
        }
        for (const parent of parents) {
            bbox = parent.fromParent(bbox);
        }
        if (isMatrixTransform(node)) {
            bbox = node.fromParent(bbox);
        }
        return bbox;
    }

    /**
     * Converts a Nodes BBox (or an arbitrary BBox if supplied) from local Node coordinate space
     * into the Canvas coordinate space.
     */
    static toCanvas(node: Node, bbox?: BBox) {
        if (bbox == null) {
            bbox = node.getBBox();
        } else if (isMatrixTransform(node)) {
            bbox = node.toParent(bbox);
        }
        for (const parent of node.traverseUp()) {
            if (isMatrixTransform(parent)) {
                bbox = parent.toParent(bbox);
            }
        }
        return bbox;
    }

    /**
     * Converts a point from canvas coordinate space into the coordinate space of the given Node.
     */
    static fromCanvasPoint(node: Node, x: number, y: number) {
        const parents = [];
        for (const parent of node.traverseUp()) {
            if (isMatrixTransform(parent)) {
                parents.unshift(parent);
            }
        }
        for (const parent of parents) {
            ({ x, y } = parent.fromParentPoint(x, y));
        }
        if (isMatrixTransform(node)) {
            ({ x, y } = node.fromParentPoint(x, y));
        }
        return { x, y };
    }

    /**
     * Converts a point from a Nodes local coordinate space into the Canvas coordinate space.
     */
    static toCanvasPoint(node: Node, x: number, y: number) {
        if (isMatrixTransform(node)) {
            ({ x, y } = node.toParentPoint(x, y));
        }
        for (const parent of node.traverseUp()) {
            if (isMatrixTransform(parent)) {
                ({ x, y } = parent.toParentPoint(x, y));
            }
        }
        return { x, y };
    }
}
