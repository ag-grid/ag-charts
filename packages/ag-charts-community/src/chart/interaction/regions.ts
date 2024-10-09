import { BBox } from '../../scene/bbox';
import { Node } from '../../scene/node';
import { Transformable } from '../../scene/transformable';
import type { BBoxContainsTester, BBoxProvider, BBoxValues } from '../../util/bboxinterface';

export enum REGIONS {
    NAVIGATOR = 'navigator',
    ROOT = 'root',
    SERIES = 'series',
    HORIZONTAL_AXES = 'horizontal-axes',
    VERTICAL_AXES = 'vertical-axes',
}

export type RegionName = `${REGIONS}`;

export type RegionBBoxProvider = BBoxProvider<BBoxContainsTester & BBoxValues>;

export class NodeRegionBBoxProvider implements RegionBBoxProvider {
    constructor(
        private readonly node: Node,
        private readonly overrideId?: string
    ) {}

    get id() {
        return this.overrideId ?? this.node.id;
    }

    get visible() {
        return this.node.visible;
    }

    toCanvasBBox() {
        return Transformable.toCanvas(this.node);
    }

    fromCanvasPoint(x: number, y: number) {
        return Transformable.fromCanvasPoint(this.node, x, y);
    }
}

export class SimpleRegionBBoxProvider extends NodeRegionBBoxProvider {
    constructor(
        node: Node,
        private readonly bboxFn: () => BBox,
        overrideId?: string
    ) {
        super(node, overrideId);
    }

    override toCanvasBBox() {
        return this.bboxFn();
    }
}
