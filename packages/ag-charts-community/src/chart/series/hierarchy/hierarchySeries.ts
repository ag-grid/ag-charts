import type { Point } from '../../../integrated-charts-scene';
import type { ModuleContext } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import { OPT_COLOR_STRING_ARRAY, OPT_STRING, Validate } from '../../../util/validation';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { Series, SeriesNodePickMode } from '../series';
import type { ISeries, SeriesNodeDatum } from '../seriesTypes';

type Mutable<T> = {
    -readonly [k in keyof T]: T[k];
};

export class HierarchyNode implements SeriesNodeDatum {
    static Walk = {
        PreOrder: 0,
        PostOrder: 1,
    };

    readonly midPoint: Point;

    constructor(
        public readonly series: ISeries<any>,
        public readonly index: number,
        public readonly datum: Record<string, any> | undefined,
        public readonly size: number,
        public readonly fill: string | undefined,
        public readonly stroke: string | undefined,
        public readonly sumSize: number,
        public readonly depth: number | undefined,
        public readonly parent: HierarchyNode | undefined,
        public readonly children: HierarchyNode[]
    ) {
        this.midPoint = { x: 0, y: 0 };
    }

    contains(other: HierarchyNode): boolean {
        let current: HierarchyNode | undefined = other;
        // Index check is a performance optimization - it does not affect correctness
        while (current != null && current.index >= this.index) {
            if (current === this) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    walk(callback: (node: HierarchyNode) => void, order = HierarchyNode.Walk.PreOrder) {
        if (order === HierarchyNode.Walk.PreOrder) {
            callback(this);
        }

        this.children.forEach((child) => {
            child.walk(callback, order);
        });

        if (order === HierarchyNode.Walk.PostOrder) {
            callback(this);
        }
    }

    *[Symbol.iterator](): Iterator<HierarchyNode> {
        yield this;

        for (const child of this.children) {
            yield* child;
        }
    }
}

export abstract class HierarchySeries<S extends SeriesNodeDatum> extends Series<S> {
    @Validate(OPT_STRING)
    childrenKey?: string = 'children';

    @Validate(OPT_STRING)
    sizeKey?: string = undefined;

    @Validate(OPT_STRING)
    colorKey?: string = undefined;

    @Validate(OPT_COLOR_STRING_ARRAY)
    fills: string[] = Object.values(DEFAULT_FILLS);

    @Validate(OPT_COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Validate(OPT_COLOR_STRING_ARRAY)
    colorRange?: string[] = undefined;

    rootNode = new HierarchyNode(this, 0, undefined, 0, undefined, undefined, 0, undefined, undefined, []);
    maxDepth = 0;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            contentGroupVirtual: false,
        });
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }

    override hasData() {
        return Array.isArray(this.data) && this.data.length > 0;
    }

    override async processData(): Promise<void> {
        const { childrenKey, sizeKey, colorKey, fills, strokes, colorRange } = this;

        let index = 0;
        const getIndex = () => {
            index += 1;
            return index;
        };

        let maxDepth = 0;
        let minColor = Infinity;
        let maxColor = -Infinity;
        const colors: (number | undefined)[] = new Array((this.data?.length ?? 0) + 1).fill(undefined);

        const createNode = (datum: any, parent: HierarchyNode): HierarchyNode => {
            const index = getIndex();
            const depth = parent.depth != null ? parent.depth + 1 : 0;
            const children = childrenKey != null ? datum[childrenKey] : undefined;
            const isLeaf = children == null || children.length === 0;

            let size = sizeKey != null ? datum[sizeKey] : undefined;
            if (Number.isFinite(size)) {
                size = Math.max(size, 0);
            } else {
                size = isLeaf ? 1 : 0;
            }

            const sumSize = size;
            maxDepth = Math.max(maxDepth, depth);

            const color = colorKey != null ? datum[colorKey] : undefined;
            if (typeof color === 'number') {
                colors[index] = color;
                minColor = Math.min(minColor, color);
                maxColor = Math.max(maxColor, color);
            }

            return appendChildren(
                new HierarchyNode(this, index, datum, size, undefined, undefined, sumSize, depth, parent, []),
                children
            );
        };

        const appendChildren = (node: Mutable<HierarchyNode>, data: S[] | undefined): HierarchyNode => {
            data?.forEach((datum) => {
                const child = createNode(datum, node);
                node.children.push(child);
                node.sumSize += child.sumSize;
            });
            return node;
        };

        const rootNode = appendChildren(
            new HierarchyNode(this, 0, undefined, 0, undefined, undefined, 0, undefined, undefined, []),
            this.data
        );

        let colorScale: ColorScale | undefined;
        if (colorRange != null && Number.isFinite(minColor) && Number.isFinite(maxColor)) {
            colorScale = new ColorScale();
            colorScale.domain = [minColor, maxColor];
            colorScale.range = colorRange;
            colorScale.update();
        }

        rootNode.children.forEach((child, index) => {
            child.walk((node: Mutable<HierarchyNode>) => {
                let fill: string | undefined;

                const color = colors[node.index];
                if (color != null) {
                    fill = colorScale?.convert(color);
                }

                fill ??= fills?.[index % fills.length];

                node.fill = fill;
                // FIXME: If there's a color scale, the strokes won't make sense. For now, just hard-code this default
                node.stroke = colorScale == null ? strokes?.[index % strokes.length] : 'rgba(0, 0, 0, 0.2)';
            });
        });

        this.rootNode = rootNode;
        this.maxDepth = maxDepth;
    }

    getDatumIdFromData(node: HierarchyNode) {
        return `${node.index}`;
    }

    getDatumId(node: HierarchyNode) {
        return this.getDatumIdFromData(node);
    }
}
