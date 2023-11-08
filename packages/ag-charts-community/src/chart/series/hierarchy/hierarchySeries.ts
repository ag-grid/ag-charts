import type { ModuleContext } from '../../../module/moduleContext';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import { OPT_STRING, Validate } from '../../../util/validation';
import { Series, SeriesNodePickMode } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';

export class HierarchyNode<Datum> {
    static Walk = {
        PreOrder: 0,
        PostOrder: 1,
    };

    constructor(
        public index: number,
        public datum: Datum | undefined,
        public size: number,
        public color: number | undefined,
        public children: HierarchyNode<Datum>[]
    ) {}

    walk(callback: (node: HierarchyNode<Datum>) => void, order = HierarchyNode.Walk.PreOrder) {
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
}

export abstract class HierarchySeries<S extends SeriesNodeDatum> extends Series<S> {
    @Validate(OPT_STRING)
    labelKey?: string;

    @Validate(OPT_STRING)
    sizeKey?: string;

    @Validate(OPT_STRING)
    colorKey?: string;

    @Validate(OPT_STRING)
    childrenKey?: string = 'children';

    rootNode = new HierarchyNode<Record<string, any> | undefined>(0, undefined, 0, undefined, []);

    maxDepth: number = 0;
    sumSize: number = 0;
    minColor: number = 0;
    maxColor: number = 0;

    constructor(moduleCtx: ModuleContext) {
        super({ moduleCtx, pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH] });
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }

    override async processData(): Promise<void> {
        const { sizeKey, colorKey, childrenKey } = this;

        let index = 0;
        const getIndex = () => {
            index += 1;
            return index;
        };

        let maxDepth = 0;
        let sumSize = 0;
        let minColor = Infinity;
        let maxColor = -Infinity;

        const createNode = (datum: any, depth: number): HierarchyNode<any> => {
            const size = Math.max((sizeKey != null ? datum[sizeKey] : undefined) ?? 0, 0);
            const color = colorKey != null ? datum[colorKey] : undefined;
            maxDepth = Math.max(maxDepth, depth);
            sumSize += size;

            if (color != null) {
                minColor = Math.min(minColor, color);
                maxColor = Math.max(maxColor, color);
            }

            return new HierarchyNode(
                getIndex(),
                datum,
                size,
                color,
                createChildren(childrenKey != null ? datum[childrenKey] : undefined, depth)
            );
        };

        const createChildren = (data: S[] | undefined, depth: number): HierarchyNode<any>[] =>
            data != null ? data.map((datum) => createNode(datum, depth + 1)) : [];

        this.rootNode = new HierarchyNode(0, undefined, 0, undefined, createChildren(this.data, 0));

        this.maxDepth = maxDepth;
        this.sumSize = sumSize;
        this.minColor = minColor;
        this.maxColor = maxColor;
    }

    getDatumIdFromData(datum: any) {
        const { labelKey } = this;

        if (labelKey != null) {
            return datum[labelKey];
        }
    }

    getDatumId(datum: any) {
        return this.getDatumIdFromData(datum.datum);
    }
}
