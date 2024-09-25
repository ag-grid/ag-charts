import { Group } from './group';
import type { ZIndexSubOrder } from './layersManager';
import { Translatable } from './transformable';

export class Layer extends Group {
    static override className = 'Layer';

    constructor(opts?: {
        name?: string;
        isVirtual?: boolean;
        zIndex?: number;
        zIndexSubOrder?: ZIndexSubOrder;
        nonEmptyChildDerivedZIndex?: boolean;
    }) {
        super({ ...opts, layer: true });
    }

    static override is(value: unknown): value is Layer {
        return value instanceof Layer;
    }
}

export class TranslatableLayer extends Translatable(Layer) {}
