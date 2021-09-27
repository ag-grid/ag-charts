import { Node } from "./node";
import { BBox } from "./bbox";
import { Matrix } from "./matrix";

export class Group extends Node {

    static className = 'Group';

    protected isContainerNode: boolean = true;

    protected _opacity: number = 1;
    set opacity(value: number) {
        value = Math.min(1, Math.max(0, value));
        if (this._opacity !== value) {
            this._opacity = value;
            this.dirty = true;
        }
    }
    get opacity(): number {
        return this._opacity;
    }

    // We consider a group to be boundless, thus any point belongs to it.
    containsPoint(x: number, y: number): boolean {
        return true;
    }

    computeBBox(): BBox {
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;

        if (this.dirtyTransform) {
            this.computeTransformMatrix();
        }

        this.children.forEach(child => {
            if (!child.visible) {
                return;
            }
            const bbox = child.computeBBox();
            if (!bbox) {
                return;
            }

            if (!(child instanceof Group)) {
                if (child.dirtyTransform) {
                    child.computeTransformMatrix();
                }
                const matrix = Matrix.flyweight(child.matrix);
                let parent = child.parent;
                while (parent) {
                    matrix.preMultiplySelf(parent.matrix);
                    parent = parent.parent;
                }
                matrix.transformBBox(bbox, 0, bbox);
            }

            const x = bbox.x;
            const y = bbox.y;

            if (x < left) {
                left = x;
            }
            if (y < top) {
                top = y;
            }
            if (x + bbox.width > right) {
                right = x + bbox.width;
            }
            if (y + bbox.height > bottom) {
                bottom = y + bbox.height;
            }
        });

        return new BBox(
            left,
            top,
            right - left,
            bottom - top
        );
    }

    render(ctx: CanvasRenderingContext2D) {
        // A group can have `scaling`, `rotation`, `translation` properties
        // that are applied to the canvas context before children are rendered,
        // so all children can be transformed at once.
        if (this.dirtyTransform) {
            this.computeTransformMatrix();
        }
        this.matrix.toContext(ctx);

        const children = this.children;
        const n = children.length;

        ctx.globalAlpha *= this.opacity;

        if (this.dirtyZIndex) {
            this.dirtyZIndex = false;
            children.sort((a, b) => a.zIndex - b.zIndex);
        }

        for (let i = 0; i < n; i++) {
            const child = children[i];
            if (child.visible) {
                ctx.save();
                child.render(ctx);
                ctx.restore();
            }
        }

        // debug
        // this.computeBBox().render(ctx, {
        //     label: this.id,
        //     resetTransform: true,
        //     fillStyle: 'rgba(0, 0, 0, 0.5)'
        // });
    }
}
