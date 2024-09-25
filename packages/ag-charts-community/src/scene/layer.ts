import { Group } from './group';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import { type ChildNodeCounts, Node, RedrawType } from './node';
import { Translatable } from './transformable';

export class Layer extends Group {
    static override className = 'Layer';

    constructor(
        protected override readonly opts?: {
            name?: string;
            isVirtual?: boolean;
            zIndex?: number;
            zIndexSubOrder?: ZIndexSubOrder;
            deriveZIndexFromChildren?: boolean; // TODO remove feature
        }
    ) {
        super({ ...opts, layer: true });
    }

    static override is(value: unknown): value is Layer {
        return value instanceof Layer;
    }

    override markDirty(type = RedrawType.TRIVIAL) {
        super.markDirty(type, !this.isVirtual && this.layer != null ? RedrawType.TRIVIAL : type);
    }

    override preRender(): ChildNodeCounts {
        const counts = super.preRender();

        if (counts.nonGroups > 0) {
            this.layer ??= this._layerManager?.addLayer({
                name: this.name,
                zIndex: this.zIndex,
                zIndexSubOrder: this.zIndexSubOrder,
                getComputedOpacity: () => this.getComputedOpacity(),
                getVisibility: () => this.getVisibility(),
            });
            if (this.opts?.deriveZIndexFromChildren) {
                this.deriveZIndexFromChildren();
            }
        }

        return counts;
    }

    private deriveZIndexFromChildren() {
        let lastChild: Node | undefined;
        for (const child of this.children()) {
            if (!child.childNodeCounts.nonGroups) continue;
            if (!lastChild || Group.compareChildren(lastChild, child) < 0) {
                lastChild = child;
            }
        }
        this.zIndex = lastChild?.zIndex ?? -Infinity;
        this.zIndexSubOrder = lastChild?.zIndexSubOrder;
    }

    override _setLayerManager(layersManager?: LayersManager) {
        if (this.layer) {
            this._layerManager?.removeLayer(this.layer);
            this.layer = undefined;
        }
        super._setLayerManager(layersManager);
    }

    protected override onVisibleChange() {
        if (this.layer) {
            this.layer.enabled = this.visible;
        }
    }

    protected override onZIndexChange() {
        super.onZIndexChange();
        if (this.layer) {
            this._layerManager?.moveLayer(this.layer, this.zIndex, this.zIndexSubOrder);
        }
    }
}

export class TranslatableLayer extends Translatable(Layer) {}
