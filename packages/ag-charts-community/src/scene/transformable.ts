import { IDENTITY_MATRIX_ELEMENTS, Matrix } from './matrix';
import { Node, SceneChangeDetection } from './node';

type Constructor<T> = new (...args: any[]) => T;

type MatrixTransformType<T> = T & {
    updateMatrix(matrix: Matrix): void;
};

export function MatrixTransform<N extends Node>(Parent: Constructor<N>) {
    const ParentNode = Parent as Constructor<Node>;

    // Make sure we don't mixin `MatrixTransformInternal` multiple times.
    let nextType = Parent;
    while (nextType != null) {
        if (nextType.name === 'MatrixTransformInternal') {
            return Parent as unknown as Constructor<MatrixTransformType<N>>;
        }
        nextType = Object.getPrototypeOf(nextType);
    }

    const TRANSFORM_MATRIX = Symbol('matrix_transform');
    class MatrixTransformInternal extends ParentNode {
        private [TRANSFORM_MATRIX] = new Matrix();

        private _dirtyTransform = false;
        override markDirtyTransform() {
            this._dirtyTransform = true;
            super.markDirtyTransform();
        }

        protected updateMatrix(_matrix: Matrix) {
            // For override by sub-classes.
        }

        override computeTransformMatrix() {
            if (!this._dirtyTransform && !this.dirtyTransform) return;

            // Need to force parent re-calculation as we modify the matrix in place.
            super.computeTransformMatrix(true);
            if (this._dirtyTransform) {
                this[TRANSFORM_MATRIX].setElements(IDENTITY_MATRIX_ELEMENTS);
                this.updateMatrix(this[TRANSFORM_MATRIX]);
                this._dirtyTransform = false;
            }
            if (!this[TRANSFORM_MATRIX].identity) {
                this.matrix.multiplySelf(this[TRANSFORM_MATRIX]);
            }
        }
    }
    return MatrixTransformInternal as unknown as Constructor<MatrixTransformType<N>>;
}

export type RotatableType<T> = T & {
    rotationCenterX: number | null;
    rotationCenterY: number | null;
    rotation: number;
};

export function Rotatable<N extends Node>(Parent: Constructor<N>): Constructor<RotatableType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    const ROTATABLE_MATRIX = Symbol('matrix_rotatable');
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

export type ScalableType<T> = T & {
    scalingX: number;
    scalingY: number;
    scalingCenterX: number | null;
    scalingCenterY: number | null;
};

export function Scalable<N extends Node>(Parent: Constructor<N>): Constructor<ScalableType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    const SCALABLE_MATRIX = Symbol('matrix_scalable');
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

export type TranslatableType<T> = T & {
    translationX: number;
    translationY: number;
};

export function Translatable<N extends Node>(Parent: Constructor<N>): Constructor<TranslatableType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    const TRANSLATABLE_MATRIX = Symbol('matrix_scalable');
    class ScalableInternal extends MatrixTransform(ParentNode) {
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
    return ScalableInternal as unknown as Constructor<TranslatableType<N>>;
}
