import { BBox } from './bbox';
import { Matrix } from './matrix';
import { Node, SceneChangeDetection } from './node';

type Constructor<T> = new (...args: any[]) => T;

type MatrixTransformType<T> = T & {
    _matrix: Matrix;
    updateMatrix(): void;
};

export function MatrixTransform<N extends Node>(Parent: Constructor<N>) {
    const IDENTITY_MATRIX = new Matrix();

    const ParentNode = Parent as Constructor<Node>;
    class MatrixTransformInternal extends ParentNode {
        _matrix = new Matrix();

        private _dirtyTransform = false;
        override markDirtyTransform() {
            this._dirtyTransform = true;
            super.markDirtyTransform();
        }

        protected updateMatrix() {
            // Reset to identify transform by default;
            this._matrix = IDENTITY_MATRIX;
            console.log('Matrix reset to identity matrix');
        }

        protected override computeBBox(): BBox | undefined {
            if (this._dirtyTransform) {
                this.updateMatrix();
                this._dirtyTransform = false;
            }
            const bbox = super.computeBBox();
            return bbox ? this._matrix.transformBBox(bbox) : undefined;
        }

        override computeTransformMatrix() {
            super.computeTransformMatrix();
            if (this._dirtyTransform) {
                this.updateMatrix();
                this._dirtyTransform = false;
            }
            if (this._matrix !== IDENTITY_MATRIX) {
                this.matrix.multiplySelf(this._matrix);
            }
        }
    }
    return MatrixTransformInternal as unknown as Constructor<MatrixTransformType<N>>;
}

// export type RotatableType<T> = T & {
//     rotationCenterX: number | null;
//     rotationCenterY: number | null;
//     rotation: number;
// };

// export function Rotatable<N extends Node>(Parent: Constructor<N>): Constructor<RotatableType<N>> {
//     const ParentNode = Parent as Constructor<Node>;
//     class RotatableInternal extends MatrixTransform(ParentNode) {
//         rotationCenterX: number | null = null;
//         rotationCenterY: number | null = null;
//         rotation: number = 0;

//         override updateMatrix() {
//             const { rotation, rotationCenterX, rotationCenterY } = this;

//             if (rotation === 0) {
//                 super.updateMatrix();
//                 return;
//             }

//             Matrix.updateTransformMatrix(this._matrix, 1, 1, rotation, 0, 0, {
//                 rotationCenterX,
//                 rotationCenterY,
//             });
//         }
//     }
//     return RotatableInternal as unknown as Constructor<RotatableType<N>>;
// }

export type ScalableType<T> = T & {
    scalingX: number;
    scalingY: number;
    scalingCenterX: number | null;
    scalingCenterY: number | null;
};

export function Scalable<N extends Node>(Parent: Constructor<N>): Constructor<ScalableType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    class ScalableInternal extends MatrixTransform(ParentNode) {
        @SceneChangeDetection({ type: 'transform' })
        scalingX: number = 1;
        @SceneChangeDetection({ type: 'transform' })
        scalingY: number = 1;
        @SceneChangeDetection({ type: 'transform' })
        scalingCenterX: number | null = null;
        @SceneChangeDetection({ type: 'transform' })
        scalingCenterY: number | null = null;

        override updateMatrix() {
            const { scalingX, scalingY, scalingCenterX, scalingCenterY } = this;

            if (scalingX === 1 && scalingY === 1) {
                super.updateMatrix();
                return;
            }

            Matrix.updateTransformMatrix(this._matrix, scalingX, scalingY, 0, 0, 0, {
                scalingCenterX,
                scalingCenterY,
            });
            console.log('Matrix setup to scale', { scalingX, scalingY });
        }
    }
    return ScalableInternal as unknown as Constructor<ScalableType<N>>;
}
