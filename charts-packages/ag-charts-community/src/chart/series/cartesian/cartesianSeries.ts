import { Series, SeriesNodeDataContext, SeriesNodeDatum, SeriesNodePickMode } from '../series';
import { ChartAxis, ChartAxisDirection } from '../../chartAxis';
import { SeriesMarker, SeriesMarkerFormatterParams } from '../seriesMarker';
import { isContinuous, isDiscrete } from '../../../util/value';
import { Path } from '../../../scene/shape/path';
import { Selection } from '../../../scene/selection';
import { Marker } from '../../marker/marker';
import { Group } from '../../../scene/group';
import { Text } from '../../../scene/shape/text';
import { Node } from '../../../scene/node';
import { RedrawType, SceneChangeDetection } from '../../../scene/changeDetectable';
import { CategoryAxis } from '../../axis/categoryAxis';

type NodeDataSelection<N extends Node, ContextType extends SeriesNodeDataContext> = Selection<
    N,
    Group,
    ContextType['nodeData'][number],
    any
>;
type LabelDataSelection<N extends Node, ContextType extends SeriesNodeDataContext> = Selection<
    N,
    Group,
    ContextType['labelData'][number],
    any
>;

interface SubGroup<C extends SeriesNodeDataContext, SceneNodeType extends Node> {
    paths: Path[];
    group: Group;
    pickGroup: Group;
    markerGroup?: Group;
    datumSelection: NodeDataSelection<SceneNodeType, C>;
    labelSelection: LabelDataSelection<Text, C>;
    markerSelection?: NodeDataSelection<Marker, C>;
}

type PickGroupInclude = 'mainPath' | 'datumNodes' | 'markers';
type SeriesFeature = 'markers';
interface SeriesOpts {
    pickGroupIncludes: PickGroupInclude[];
    pathsPerSeries: number;
    features: SeriesFeature[];
}

export abstract class CartesianSeries<
    C extends SeriesNodeDataContext<any, any>,
    N extends Node = Marker
> extends Series<C> {
    private contextNodeData: C[];

    private highlightSelection: NodeDataSelection<N, C> = Selection.select(this.highlightGroup).selectAll<N>();

    private subGroups: SubGroup<C, any>[] = [];
    private subGroupId: number = 0;

    private readonly opts: SeriesOpts;

    /**
     * The assumption is that the values will be reset (to `true`)
     * in the {@link yKeys} setter.
     */
    protected readonly seriesItemEnabled = new Map<string, boolean>();

    protected constructor(
        opts: Partial<SeriesOpts> & { pickModes?: SeriesNodePickMode[] } = {}) {
        super({ seriesGroupUsesLayer: false, pickModes: opts.pickModes });

        const {
            pickGroupIncludes = ['datumNodes'] as PickGroupInclude[],
            pathsPerSeries = 1,
            features = [],
        } = opts;
        this.opts = { pickGroupIncludes, pathsPerSeries, features };
    }

    directionKeys: { [key in ChartAxisDirection]?: string[] } = {
        [ChartAxisDirection.X]: ['xKey'],
        [ChartAxisDirection.Y]: ['yKey'],
    };

    /**
     * Note: we are passing `isContinuousX` and `isContinuousY` into this method because it will
     *       typically be called inside a loop and this check only needs to happen once.
     * @param x A domain value to be plotted along the x-axis.
     * @param y A domain value to be plotted along the y-axis.
     * @param isContinuousX Typically this will be the value of `xAxis.scale instanceof ContinuousScale`.
     * @param isContinuousY Typically this will be the value of `yAxis.scale instanceof ContinuousScale`.
     * @returns `[x, y]`, if both x and y are valid domain values for their respective axes/scales, or `undefined`.
     */
    protected checkDomainXY<T, K>(x: T, y: K, isContinuousX: boolean, isContinuousY: boolean): [T, K] | undefined {
        const isValidDatum =
            ((isContinuousX && isContinuous(x)) || (!isContinuousX && isDiscrete(x))) &&
            ((isContinuousY && isContinuous(y)) || (!isContinuousY && isDiscrete(y)));
        return isValidDatum ? [x, y] : undefined;
    }

    /**
     * Note: we are passing `isContinuousScale` into this method because it will
     *       typically be called inside a loop and this check only needs to happen once.
     * @param value A domain value to be plotted along an axis.
     * @param isContinuousScale Typically this will be the value of `xAxis.scale instanceof ContinuousScale` or `yAxis.scale instanceof ContinuousScale`.
     * @returns `value`, if the value is valid for its axis/scale, or `undefined`.
     */
    protected checkDatum<T>(value: T, isContinuousScale: boolean): T | string | undefined {
        if (isContinuousScale && isContinuous(value)) {
            return value;
        } else if (!isContinuousScale) {
            if (!isDiscrete(value)) {
                return String(value);
            }
            return value;
        }
        return undefined;
    }

    /**
     * Note: we are passing the xAxis and yAxis because the calling code is supposed to make sure
     *       that series has both of them defined, and also to avoid one level of indirection,
     *       e.g. `this.xAxis!.inRange(x)`, both of which are suboptimal in tight loops where this method is used.
     * @param x A range value to be plotted along the x-axis.
     * @param y A range value to be plotted along the y-axis.
     * @param xAxis The series' x-axis.
     * @param yAxis The series' y-axis.
     * @returns
     */
    protected checkRangeXY(x: number, y: number, xAxis: ChartAxis, yAxis: ChartAxis): boolean {
        return !isNaN(x) && !isNaN(y) && xAxis.inRange(x) && yAxis.inRange(y);
    }

    update(): void {
        const { seriesItemEnabled, visible, chart: { highlightedDatum: { series = undefined } = {} } = {} } = this;
        const seriesHighlighted = series ? series === this : undefined;

        const anySeriesItemEnabled = (visible && seriesItemEnabled.size === 0) || [...seriesItemEnabled.values()].some(v => v === true);

        this.updateSelections(seriesHighlighted, anySeriesItemEnabled);
        this.updateNodes(seriesHighlighted, anySeriesItemEnabled);
    }

    protected updateSelections(seriesHighlighted: boolean | undefined, anySeriesItemEnabled: boolean) {
        this.updateHighlightSelection(seriesHighlighted);

        if (!anySeriesItemEnabled) {
            return;
        }
        if (!this.nodeDataRefresh && !this.isPathOrSelectionDirty()) {
            return;
        }
        if (this.nodeDataRefresh) {
            this.nodeDataRefresh = false;
            
            this.contextNodeData = this.createNodeData();
            this.updateSeriesGroups();
        }

        this.subGroups.forEach((subGroup, seriesIdx) => {
            const { datumSelection, labelSelection, markerSelection, paths } = subGroup;
            const contextData = this.contextNodeData[seriesIdx];
            const { nodeData, labelData, itemId } = contextData;

            this.updatePaths({ seriesHighlighted, itemId, contextData, paths, seriesIdx });
            subGroup.datumSelection = this.updateDatumSelection({ nodeData, datumSelection, seriesIdx });
            subGroup.labelSelection = this.updateLabelSelection({ labelData, labelSelection, seriesIdx });
            if (markerSelection) {
                subGroup.markerSelection = this.updateMarkerSelection({ nodeData, markerSelection, seriesIdx });
            }
        });
    }

    private updateSeriesGroups() {
        const {
            contextNodeData,
            subGroups,
            opts: { pickGroupIncludes, pathsPerSeries, features },
        } = this;
        if (contextNodeData.length === subGroups.length) {
            return;
        }

        if (contextNodeData.length < subGroups.length) {
            subGroups.splice(contextNodeData.length)
                .forEach(({group, markerGroup}) => {
                    this.seriesGroup.removeChild(group);
                    if (markerGroup) {
                        this.seriesGroup.removeChild(markerGroup);
                    }
                });
        }

        while (contextNodeData.length > subGroups.length) {
            const group = new Group({
                name: `${this.id}-series-sub${this.subGroupId++}`,
                layer: true,
                zIndex: Series.SERIES_LAYER_ZINDEX,
            });
            const markerGroup = features.includes('markers') ? 
                new Group({
                    name: `${this.id}-series-sub${this.subGroupId++}-markers`,
                    layer: true,
                    zIndex: Series.SERIES_LAYER_ZINDEX,
                }) :
                undefined;
            const pickGroup = new Group();

            const pathParentGroup = pickGroupIncludes.includes('mainPath') ? pickGroup : group;
            const datumParentGroup = pickGroupIncludes.includes('datumNodes') ? pickGroup : group;

            this.seriesGroup.appendChild(group);
            if (markerGroup) {
                this.seriesGroup.appendChild(markerGroup);
            }

            const paths: Path[] = [];
            for (let index = 0; index < pathsPerSeries; index++) {
                paths[index] = new Path();
                pathParentGroup.appendChild(paths[index]);
            }
            group.appendChild(pickGroup);

            subGroups.push({
                paths,
                group,
                pickGroup,
                markerGroup,
                labelSelection: Selection.select(group).selectAll<Text>(),
                datumSelection: Selection.select(datumParentGroup).selectAll<N>(),
                markerSelection: markerGroup ? Selection.select(markerGroup).selectAll<Marker>() : undefined,
            });
        }
    }

    protected updateNodes(seriesHighlighted: boolean | undefined, anySeriesItemEnabled: boolean) {
        const { highlightSelection, contextNodeData, seriesItemEnabled, opts: { features } } = this;
        const markersEnabled = features.includes('markers');

        const visible = this.visible && this.contextNodeData?.length > 0 && anySeriesItemEnabled;
        this.group.visible = visible;
        this.seriesGroup.visible = visible;
        this.highlightGroup.visible = visible && !!seriesHighlighted;
        this.seriesGroup.opacity = this.getOpacity();

        if (markersEnabled) {
            this.updateMarkerNodes({ markerSelection: (highlightSelection as any), isHighlight: true, seriesIdx: -1 });
        } else {
            this.updateDatumNodes({ datumSelection: highlightSelection, isHighlight: true, seriesIdx: -1 });
        }

        this.subGroups.forEach((subGroup, seriesIdx) => {
            const { group, markerGroup, datumSelection, labelSelection, markerSelection, paths } = subGroup;
            const { itemId } = contextNodeData[seriesIdx];
            group.opacity = this.getOpacity({ itemId });
            group.zIndex = this.getZIndex({ itemId });
            group.visible = visible && (seriesItemEnabled.get(itemId) ?? true);
            if (markerGroup) {
                markerGroup.opacity = group.opacity;
                markerGroup.zIndex = group.zIndex >= Series.SERIES_LAYER_ZINDEX ? group.zIndex : group.zIndex + 1;
                markerGroup.visible = group.visible;
            }

            if (!group.visible) {
                return;
            }

            this.updatePathNodes({ seriesHighlighted, itemId, paths, seriesIdx });
            this.updateDatumNodes({ datumSelection, isHighlight: false, seriesIdx });
            this.updateLabelNodes({ labelSelection, seriesIdx });
            if (markersEnabled && markerSelection) {
                this.updateMarkerNodes({ markerSelection, isHighlight: false, seriesIdx });
            }
        });
    }

    protected updateHighlightSelection(seriesHighlighted?: boolean) {
        const {
            chart: { highlightedDatum: { datum = undefined } = {}, highlightedDatum = undefined } = {},
            highlightSelection,
        } = this;

        const item =
            seriesHighlighted && highlightedDatum && datum ? (highlightedDatum as C['nodeData'][number]) : undefined;
        this.highlightSelection = this.updateHighlightSelectionItem({ item, highlightSelection });
    }

    protected pickNodeExactShape(x: number, y: number): Node | undefined {
        let result = super.pickNodeExactShape(x, y);

        if (result) {
            return result;
        }

        const { opts: { pickGroupIncludes } } = this;
        const markerGroupIncluded = pickGroupIncludes.includes('markers');

        for (const { pickGroup, markerGroup } of this.subGroups) {
            result = pickGroup.pickNode(x, y);

            if (!result && markerGroupIncluded) {
                result = markerGroup?.pickNode(x, y);
            }

            if (result) {
                return result;
            }
        }
    }

    protected pickNodeClosestDatum(x: number, y: number): { datum: SeriesNodeDatum, distance: number } | undefined {
        const { xAxis, yAxis, group, contextNodeData } = this;
        const hitPoint = group.transformPoint(x, y);

        let minDistance = Infinity;
        let closestDatum: SeriesNodeDatum | undefined;

        for (const context of contextNodeData) {
            for (const datum of context.nodeData) {
                const { point: { x = NaN, y = NaN } = {} } = datum;
                const isInRange = xAxis?.inRange(x) && yAxis?.inRange(y);
                if (!isInRange) { continue; }
    
                // No need to use Math.sqrt() since x < y implies Math.sqrt(x) < Math.sqrt(y) for
                // values > 1 
                const distance = (hitPoint.x - x) ** 2 + (hitPoint.y - y) ** 2;
                if (distance < minDistance) {
                    minDistance = distance;
                    closestDatum = datum;
                }
            }
        }

        if (closestDatum) {
            return { datum: closestDatum, distance: Math.sqrt(minDistance) };
        }
    }

    protected pickNodeMainAxisFirst(
        x: number,
        y: number,
        requireCategoryAxis: boolean,
    ): { datum: SeriesNodeDatum, distance: number } | undefined {
        const { xAxis, yAxis, group, contextNodeData } = this;
        
        // Prefer to start search with any available category axis.
        const directions = [ xAxis, yAxis ]
            .filter((a): a is CategoryAxis => a instanceof CategoryAxis)
            .map(a => a.direction);
        if (requireCategoryAxis && directions.length === 0) {
            return;
        }

        // Default to X-axis unless we found a suitable category axis.
        const [ primaryDirection = ChartAxisDirection.X ] = directions;

        const hitPoint = group.transformPoint(x, y);
        const hitPointCoords = primaryDirection === ChartAxisDirection.X ?
            [hitPoint.x, hitPoint.y] : 
            [hitPoint.y, hitPoint.x];

        let minDistance = [Infinity, Infinity];
        let closestDatum: SeriesNodeDatum | undefined = undefined;

        for (const context of contextNodeData) {
            for (const datum of context.nodeData) {
                const { point: { x = NaN, y = NaN } = {} } = datum;
                const isInRange = xAxis?.inRange(x) && yAxis?.inRange(y);
                if (!isInRange) { continue; }

                const point = primaryDirection === ChartAxisDirection.X ?
                    [x, y] : 
                    [y, x];

                // Compare distances from most significant dimension to least.
                let newMinDistance = true;
                for (let i = 0; i < point.length; i++) {
                    const dist = Math.abs(point[i] - hitPointCoords[i]);
                    if (dist > minDistance[i]) {
                        newMinDistance = false;
                        break;
                    }
                    if (dist < minDistance[i]) {
                        minDistance[i] = dist;
                        minDistance.fill(Infinity, i + 1, minDistance.length);
                    }
                }

                if (newMinDistance) {
                    closestDatum = datum;
                }
            }
        }

        if (closestDatum) {
            return { datum: closestDatum, distance: Math.sqrt(minDistance[0] ** 2 + minDistance[1] ** 2) };
        }
    }


    toggleSeriesItem(itemId: string, enabled: boolean): void {
        if (this.seriesItemEnabled.size > 0) {
            this.seriesItemEnabled.set(itemId, enabled);
            this.nodeDataRefresh = true;
        } else {
            super.toggleSeriesItem(itemId, enabled);
        }
    }

    protected isPathOrSelectionDirty(): boolean {
        // Override point to allow more sophisticated dirty selection detection.
        return false;
    }

    protected updatePaths(opts: {
        seriesHighlighted?: boolean;
        itemId?: string;
        contextData: C;
        paths: Path[];
        seriesIdx: number;
    }): void {
        // Override point for sub-classes.
        opts.paths.forEach((p) => (p.visible = false));
    }

    protected updatePathNodes(_opts: {
        seriesHighlighted?: boolean;
        itemId?: string;
        paths: Path[];
        seriesIdx: number;
    }): void {
        // Override point for sub-classes.
    }

    protected updateHighlightSelectionItem(opts: {
        item?: C['nodeData'][number];
        highlightSelection: NodeDataSelection<N, C>;
    }): NodeDataSelection<N, C> {
        const { opts: { features } } = this;
        const markersEnabled = features.includes('markers');

        const { item, highlightSelection } = opts;
        const nodeData = item ? [item] : [];

        if (markersEnabled) {
            const markerSelection = highlightSelection as any;
            return this.updateMarkerSelection({ nodeData, markerSelection, seriesIdx: -1 }) as any;
        } else {
            return this.updateDatumSelection({ nodeData, datumSelection: highlightSelection, seriesIdx: -1 });
        }
    }

    protected updateDatumSelection(opts: {
        nodeData: C['nodeData'];
        datumSelection: NodeDataSelection<N, C>;
        seriesIdx: number;
    }): NodeDataSelection<N, C> {
        // Override point for sub-classes.
        return opts.datumSelection;
    }
    protected updateDatumNodes(_opts: {
        datumSelection: NodeDataSelection<N, C>;
        isHighlight: boolean;
        seriesIdx: number;
    }): void {
        // Override point for sub-classes.
    }

    protected updateMarkerSelection(opts: {
        nodeData: C['nodeData'];
        markerSelection: NodeDataSelection<Marker, C>;
        seriesIdx: number;
    }): NodeDataSelection<Marker, C> {
        // Override point for sub-classes.
        return opts.markerSelection;
    }
    protected updateMarkerNodes(_opts: {
        markerSelection: NodeDataSelection<Marker, C>;
        isHighlight: boolean;
        seriesIdx: number;
    }): void {
        // Override point for sub-classes.
    }

    protected abstract updateLabelSelection(opts: {
        labelData: C['labelData'];
        labelSelection: LabelDataSelection<Text, C>;
        seriesIdx: number;
    }): LabelDataSelection<Text, C>;
    protected abstract updateLabelNodes(opts: { labelSelection: LabelDataSelection<Text, C>; seriesIdx: number }): void;
}

export interface CartesianSeriesMarkerFormat {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    size?: number;
}

export class CartesianSeriesMarker extends SeriesMarker {
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    formatter?: (params: CartesianSeriesMarkerFormatterParams) => CartesianSeriesMarkerFormat = undefined;
}

export interface CartesianSeriesMarkerFormatterParams extends SeriesMarkerFormatterParams {
    xKey: string;
    yKey: string;
}
