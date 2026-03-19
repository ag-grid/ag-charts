import {
    BaseProperties,
    PropertiesArray,
    Property,
    type ScaleTickParams,
    type WrapOptions,
    angularPadding,
    createIdsGenerator,
    extent,
    extractDomain,
    getMaxInnerRectSize,
    inRange,
    isArray,
    isObject,
    isTruncated,
    normalizeAngle360FromDegrees,
    sortBasedOnArray,
    toArray,
    toPlainText,
    wrapTextOrSegments,
} from 'ag-charts-core';
import type { FontStyle, FontWeight, Padding, TextWrap } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { GroupedCategoryScale } from '../../scale/groupedCategoryScale';
import { BBox } from '../../scene/bbox';
import { PointerEvents } from '../../scene/node';
import type { ShapeColor } from '../../scene/shape/shape';
import { TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import type { AxisPrimaryTickCount } from '../../util/secondaryAxisTicks';
import type { ChartLayout } from '../chartAxis';
import { createDatumId } from '../data/processors';
import { LabelBorder } from '../label';
import type { LabelNodeDatum } from './axis';
import type { GridLineStyleTickDatum } from './cartesianAxis';
import { CategoryAxis } from './categoryAxis';
import { type GroupedCategoryKey, type TreeLayout, treeLayout } from './tree';

export const MIN_CATEGORY_SPACING = 5;

type TreeNode = TreeLayout['nodes'][number];

interface FilterTicksResult {
    ticks: GroupedCategoryKey[];
    positions?: Map<GroupedCategoryKey, number>;
    depthsMap: Map<GroupedCategoryKey, number>;
}

interface ComputedGroupAxisLayout {
    tickLabelLayout: LabelNodeDatum[];
    tickSizeAtDepth: number[];
    spacing: number;
}

class DepthLabelProperties extends BaseProperties {
    @Property
    enabled = true;

    @Property
    avoidCollisions?: boolean;

    @Property
    border = new LabelBorder();

    @Property
    color?: string;

    @Property
    cornerRadius?: number;

    @Property
    spacing?: number;

    @Property
    rotation?: number;

    @Property
    wrapping?: TextWrap;

    @Property
    truncate?: boolean;

    @Property
    fill?: ShapeColor;

    @Property
    fontStyle?: FontStyle;

    @Property
    fontWeight?: FontWeight;

    @Property
    fontSize?: number;

    @Property
    fontFamily?: string;

    @Property
    padding?: Padding;
}

class DepthTickProperties extends BaseProperties {
    @Property
    enabled = true;

    @Property
    width?: number;

    @Property
    stroke?: string;
}

class DepthProperties extends BaseProperties {
    @Property
    label = new DepthLabelProperties();

    @Property
    tick = new DepthTickProperties();
}

export class GroupedCategoryAxis extends CategoryAxis<GroupedCategoryScale<GroupedCategoryKey>> {
    static override readonly className = 'GroupedCategoryAxis';
    static override readonly type = 'grouped-category' as const;

    // Label scale (labels are positioned between ticks, tick count = label count + 1).
    // We don't call is `labelScale` for consistency with other axes.
    readonly tickScale = new GroupedCategoryScale<GroupedCategoryKey>();

    private computedLayout?: ComputedGroupAxisLayout = undefined;
    private tickTreeLayout?: TreeLayout = undefined;
    private tickNodes?: Map<GroupedCategoryKey, TreeNode> = undefined;
    private leafNodeToKey?: Map<TreeNode, GroupedCategoryKey> = undefined;
    private filterTickCache?: {
        range0: number;
        range1: number;
        step: number;
        inset: number;
        bandwidth: number;
        vr0: number;
        vr1: number;
        result: FilterTicksResult;
    };

    // Reusable working data structures for filterTicksTopDown
    private readonly ftdPositions = new Map<GroupedCategoryKey, number>();
    private readonly ftdCandidates = new Set<GroupedCategoryKey>();
    private readonly ftdKept = new Set<GroupedCategoryKey>();
    private ftdByDepth: { positions: number[]; ticks: GroupedCategoryKey[] }[] = [];
    private readonly ftdStack: TreeNode[] = [];

    @Property
    depthOptions = new PropertiesArray(DepthProperties);

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new GroupedCategoryScale<GroupedCategoryKey>());

        this.includeInvisibleDomains = true;
        this.tickScale.paddingInner = 1;
        this.tickScale.paddingOuter = 0;
    }

    private getDepthOptionsMap(maxDepth: number) {
        const optionsMap = [];
        const { depthOptions, label } = this;
        const defaultNonLeafRotation = this.horizontal ? 0 : -90;
        for (let i = 0; i < maxDepth; i++) {
            optionsMap.push(
                depthOptions[i]?.label.enabled ?? label.enabled
                    ? {
                          enabled: true,
                          spacing: depthOptions[i]?.label.spacing ?? label.spacing,
                          wrapping: depthOptions[i]?.label.wrapping ?? label.wrapping,
                          truncate: depthOptions[i]?.label.truncate ?? label.truncate,
                          rotation: depthOptions[i]?.label.rotation ?? (i ? defaultNonLeafRotation : label.rotation), // Default top-level label rotation only applies to label leaves
                          avoidCollisions: depthOptions[i]?.label.avoidCollisions ?? label.avoidCollisions,
                      }
                    : { enabled: false, spacing: 0, rotation: 0, avoidCollisions: false }
            );
        }
        return optionsMap;
    }

    private updateCategoryLabels() {
        if (!this.computedLayout) return;
        this.tickLabelGroupSelection.update(this.computedLayout.tickLabelLayout).each((node, datum) => {
            node.fill = datum.color;
            node.text = datum.text;
            node.textBaseline = datum.textBaseline;
            node.textAlign = datum.textAlign ?? 'center';
            node.pointerEvents = datum.textUntruncated == null ? PointerEvents.None : PointerEvents.All;
            node.setFont(datum);
            node.setBoxing(datum);
        });
    }

    private updateAxisLine() {
        if (!this.computedLayout) return;

        this.lineNode.visible = this.line.enabled;
        this.lineNode.stroke = this.line.stroke;
        this.lineNode.strokeWidth = this.line.width;
    }

    private computeLayout() {
        this.updateDirection();
        this.updateScale();

        const { step } = this.scale;
        const { title, label, range, depthOptions, horizontal, line } = this;
        const scrollbar = this.chartLayout?.scrollbars?.[this.id];
        const scrollbarThickness = this.getScrollbarThickness(scrollbar);
        const tickSpacing = this.getTickSpacing();

        this.lineNode.datum = horizontal
            ? { x1: range[0], x2: range[1], y1: 0, y2: 0 }
            : { x1: 0, x2: 0, y1: range[0], y2: range[1] };
        this.lineNode.setProperties({ stroke: line.stroke, strokeWidth: line.enabled ? line.width : 0 });

        this.tickTreeLayout?.resize(this.scale.range, this.scale.step, this.scale.inset, this.scale.bandwidth);

        if (!this.tickTreeLayout?.depth) {
            return { bbox: BBox.zero, spacing: 0, tickSizeAtDepth: [], tickLabelLayout: [] };
        }

        const { depth: maxDepth, nodes: treeLabels } = this.tickTreeLayout;
        const sideFlag = horizontal ? -label.getSideFlag() : label.getSideFlag();

        const tickLabelLayout: LabelNodeDatum[] = [];
        const labelBBoxes: Map<number, BBox> = new Map();
        const tempText = new TransformableText();

        const optionsMap = this.getDepthOptionsMap(maxDepth);
        const labelSpacing = sideFlag * (optionsMap[0].spacing + scrollbarThickness + tickSpacing);

        const tickFormatter = this.tickFormatter(this.scale.domain, this.scale.domain, false);

        // First pass: measure labels and cache computed text/styles
        type LabelCacheEntry = { text: any; styles: any; truncatedText: string | undefined };
        const labelDataCache = new Map<number, LabelCacheEntry>();
        const depthLabelMaxSize: Record<number, number> = {};
        for (const [index, datum] of treeLabels.entries()) {
            const depth = maxDepth - datum.depth;
            depthLabelMaxSize[depth] ??= 0;

            const isLeaf = !datum.children.length;
            if (isLeaf && step < MIN_CATEGORY_SPACING) continue;
            if (!optionsMap[depth]?.enabled || !inRange(datum.screen, range)) continue;

            let maxWidth = (datum.leafCount || 1) * step;
            if (maxWidth < MIN_CATEGORY_SPACING) continue;

            const inputText = tickFormatter(datum.label, index - 1);
            let text = inputText;
            const labelStyles = this.getLabelStyles(
                { value: datum.index, formattedValue: text, depth },
                depthOptions[depth]?.label
            );

            if (label.avoidCollisions) {
                const rotation = optionsMap[depth].rotation;
                let maxHeight = this.thickness;
                if (rotation != null) {
                    const innerRect = getMaxInnerRectSize(rotation, maxWidth, maxHeight);
                    maxWidth = innerRect.width;
                    maxHeight = innerRect.height;
                }
                const wrapOptions: WrapOptions = {
                    font: labelStyles,
                    textWrap: optionsMap[depth].wrapping,
                    overflow: optionsMap[depth].truncate ? 'ellipsis' : 'hide',
                    maxWidth,
                    maxHeight,
                };
                text = wrapTextOrSegments(text, wrapOptions) || text;
            }

            const truncatedText = text !== inputText && isTruncated(text) ? toPlainText(inputText) : undefined;

            tempText.x = horizontal ? datum.screen : labelSpacing;
            tempText.y = horizontal ? labelSpacing : datum.screen;
            tempText.rotation = 0;
            tempText.fill = labelStyles.color;
            tempText.text = text;
            tempText.textAlign = 'center';
            tempText.textBaseline = label.parallel ? 'top' : 'bottom';
            tempText.setFont(labelStyles);
            tempText.setBoxing(labelStyles);

            if (!tempText.getBBox()) continue;

            labelDataCache.set(index, { text, styles: labelStyles, truncatedText });
            labelBBoxes.set(index, tempText.getBBox());
            tempText.rotation = normalizeAngle360FromDegrees(optionsMap[depth]?.rotation);

            const { width, height } = tempText.getBBox();
            const labelSize = horizontal ? height : width;

            if (depthLabelMaxSize[depth] < labelSize) {
                depthLabelMaxSize[depth] = labelSize;
            }
        }

        // Precompute cumulative depth sizes
        const nestedPaddingArr: number[] = [0];
        const tickSizeAtDepth: number[] = [(depthLabelMaxSize[0] ?? 0) + (optionsMap[0]?.spacing ?? 0)];
        let labelSum = depthLabelMaxSize[0] ?? 0;
        let spacingSum = optionsMap[0]?.spacing ?? 0;
        let innerSpacingSum = 0;
        for (let d = 1; d < maxDepth; d++) {
            innerSpacingSum += optionsMap[d]?.spacing ?? 0;
            nestedPaddingArr[d] = labelSum + innerSpacingSum;
            labelSum += depthLabelMaxSize[d] ?? 0;
            spacingSum += optionsMap[d]?.spacing ?? 0;
            tickSizeAtDepth[d] = labelSum + spacingSum;
        }

        // Second pass: position labels using cached data
        const idGenerator = createIdsGenerator();
        for (const [index, datum] of treeLabels.entries()) {
            if (index === 0) continue;

            const cached = labelDataCache.get(index);
            if (!cached) continue;

            const isLeaf = !datum.children.length;
            const depth = maxDepth - datum.depth;

            if (isLeaf && step < MIN_CATEGORY_SPACING) continue;

            const labelRotation = normalizeAngle360FromDegrees(optionsMap[depth].rotation);
            const labelBBox = labelBBoxes.get(index);
            if (!labelBBox) continue;
            const { width: w, height: h } = labelBBox;
            const depthPadding = nestedPaddingArr[depth] ?? 0;

            // Restore tempText from cache
            tempText.x = horizontal ? datum.screen : labelSpacing;
            tempText.y = horizontal ? labelSpacing : datum.screen;
            tempText.fill = cached.styles.color;
            tempText.text = cached.text;
            tempText.setFont(cached.styles);
            tempText.setBoxing(cached.styles);
            tempText.textAlign = 'center';
            tempText.textBaseline = 'middle';
            tempText.rotation = labelRotation;

            if (horizontal) {
                tempText.y += (depthPadding + angularPadding(w / 2, h / 2, labelRotation)) * sideFlag;
                tempText.rotationCenterX = datum.screen;
                tempText.rotationCenterY = tempText.y;
            } else {
                tempText.x +=
                    depthPadding * sideFlag +
                    angularPadding(
                        (optionsMap[depth].spacing * sideFlag + w) / 2,
                        label.mirrored ? w : 0,
                        labelRotation
                    ) -
                    w / 2;
                tempText.rotationCenterX = tempText.x;
                tempText.rotationCenterY = datum.screen;
            }

            if (optionsMap[depth].avoidCollisions) {
                const { width, height } = tempText.getBBox();
                const labelSize = horizontal ? width : height;
                const availableRange = isLeaf ? step : datum.leafCount * step;
                if (labelSize > availableRange) {
                    labelBBoxes.delete(index);
                    continue;
                }
            }

            const text = tempText.getPlainText();
            const boxing = tempText.getBoxingProperties();

            tickLabelLayout.push({
                text,
                textUntruncated: cached.truncatedText,
                visible: true,
                tickId: idGenerator(text),
                range: this.scale.range,
                border: boxing.border,
                color: tempText.fill as string,
                cornerRadius: boxing.cornerRadius,
                fill: boxing.fill,
                fontFamily: tempText.fontFamily,
                fontSize: tempText.fontSize,
                fontStyle: tempText.fontStyle,
                fontWeight: tempText.fontWeight,
                padding: boxing.padding,
                rotation: tempText.rotation,
                rotationCenterX: tempText.rotationCenterX,
                rotationCenterY: tempText.rotationCenterY,
                textAlign: tempText.textAlign,
                textBaseline: tempText.textBaseline,
                x: tempText.x,
                y: tempText.y,
            });
            labelBBoxes.set(index, Transformable.toCanvas(tempText));
        }

        const maxTickSize = tickSizeAtDepth[maxDepth - 1] ?? 0;

        const maxTickSizeWithScrollbar = maxTickSize + scrollbarThickness + tickSpacing;
        const bboxes = [
            this.lineNodeBBox(),
            BBox.merge(labelBBoxes.values()),
            new BBox(0, 0, maxTickSizeWithScrollbar * sideFlag, 0),
        ];

        const combined = BBox.merge(bboxes);
        const labelThickness = horizontal ? combined.height : combined.width;
        const { spacing, scrollbarLayout } = this.applyScrollbarLayout(bboxes, labelThickness, scrollbar);
        this.layout.labelThickness = labelThickness;
        this.layout.scrollbar = scrollbarLayout;

        if (title.enabled) {
            bboxes.push(this.titleBBox(this.scale.domain, spacing));
        }

        const mergedBBox = BBox.merge(bboxes);

        this.layoutCrossLines();

        return { bbox: mergedBBox, spacing, tickSizeAtDepth, tickLabelLayout };
    }

    private buildDepthsMap(ticks: GroupedCategoryKey[]): Map<GroupedCategoryKey, number> {
        const { tickNodes, tickScale, tickTreeLayout } = this;
        if (!tickTreeLayout || !tickNodes) return new Map();
        const maxDepth = tickTreeLayout.depth;
        const map = new Map<GroupedCategoryKey, number>();
        for (const tickLabel of ticks) {
            const node = tickNodes.get(tickLabel);
            const depth = node == null ? maxDepth - 1 : Math.min(node.separatorDepth, maxDepth - 1);
            map.set(tickLabel, depth);
        }
        if (tickScale.step < MIN_CATEGORY_SPACING && ticks.length > 1) {
            const trailingTick = ticks.at(-1);
            if (trailingTick && !tickNodes.has(trailingTick)) {
                const previousTick = ticks.at(-2);
                const previousDepth = previousTick ? map.get(previousTick) : undefined;
                if (previousDepth != null) {
                    map.set(trailingTick, previousDepth);
                }
            }
        }
        return map;
    }

    private filterTicksTopDown(rawTicks: GroupedCategoryKey[], visibleRange?: [number, number]): FilterTicksResult {
        const { tickScale, tickTreeLayout, tickNodes, leafNodeToKey } = this;
        if (!tickTreeLayout || tickNodes == null || leafNodeToKey == null) {
            return { ticks: rawTicks, depthsMap: new Map() };
        }

        // Check memoization cache
        const range = tickScale.range;
        const step = tickScale.step;
        const inset = tickScale.inset;
        const bandwidth = tickScale.bandwidth;
        const vr0 = visibleRange?.[0] ?? 0;
        const vr1 = visibleRange?.[1] ?? 1;
        const cache = this.filterTickCache;
        if (
            cache &&
            cache.range0 === range[0] &&
            cache.range1 === range[1] &&
            cache.step === step &&
            cache.inset === inset &&
            cache.bandwidth === bandwidth &&
            cache.vr0 === vr0 &&
            cache.vr1 === vr1
        ) {
            return cache.result;
        }

        const storeResult = (result: FilterTicksResult): FilterTicksResult => {
            this.filterTickCache = { range0: range[0], range1: range[1], step, inset, bandwidth, vr0, vr1, result };
            return result;
        };

        if (tickScale.step >= MIN_CATEGORY_SPACING) {
            return storeResult({ ticks: rawTicks, depthsMap: this.buildDepthsMap(rawTicks) });
        }

        // Clear reusable structures
        const tickPositions = this.ftdPositions;
        tickPositions.clear();
        const candidateTicks = this.ftdCandidates;
        candidateTicks.clear();
        const keptTicks = this.ftdKept;
        keptTicks.clear();
        const stack = this.ftdStack;
        stack.length = 0;

        const getPosition = (tickLabel: GroupedCategoryKey) => {
            if (!tickPositions.has(tickLabel)) {
                tickPositions.set(tickLabel, tickScale.convert(tickLabel));
            }
            return tickPositions.get(tickLabel)!;
        };

        const countFiniteTicks = (ticks: GroupedCategoryKey[]) => {
            let count = 0;
            for (const tickLabel of ticks) {
                if (Number.isFinite(getPosition(tickLabel))) {
                    count += 1;
                    if (count > 1) break;
                }
            }
            return count;
        };

        let ticksToRender = rawTicks;
        if (visibleRange != null && (visibleRange[0] !== 0 || visibleRange[1] !== 1)) {
            const domain = tickScale.domain;
            const tickCount = domain.length;
            if (tickCount > 0) {
                const start = Math.max(0, Math.floor(visibleRange[0] * tickCount) - 1);
                const end = Math.min(tickCount - 1, Math.ceil(visibleRange[1] * tickCount));
                if (rawTicks.length === 0) {
                    ticksToRender = domain.slice(start, end + 1);
                } else {
                    const leftTick = domain[start];
                    const rightTick = domain[end];
                    const firstTick = rawTicks[0];
                    const lastTick = rawTicks.at(-1);
                    const needsLeft = leftTick != null && leftTick !== firstTick;
                    const needsRight = rightTick != null && rightTick !== lastTick;
                    if (needsLeft || needsRight) {
                        const extended = needsLeft ? [leftTick] : [];
                        extended.push(...rawTicks);
                        if (needsRight) {
                            extended.push(rightTick);
                        }
                        ticksToRender = extended;
                    }
                }
            }
        }

        if (countFiniteTicks(ticksToRender) <= 1) {
            return storeResult({
                ticks: ticksToRender,
                positions: tickPositions,
                depthsMap: this.buildDepthsMap(ticksToRender),
            });
        }

        for (const tickLabel of ticksToRender) {
            candidateTicks.add(tickLabel);
        }
        for (const tickLabel of ticksToRender) {
            const node = tickNodes.get(tickLabel);
            let current = node?.parent;
            while (current?.parent) {
                const leftmost = leafNodeToKey.get(current.leftmostLeaf);
                if (leftmost != null) {
                    candidateTicks.add(leftmost);
                }
                current = current.parent;
            }
        }

        const maxHierarchyDepth = Math.max(0, tickTreeLayout.depth - 1);
        const getHierarchyDepth = (node: TreeNode) => Math.min(maxHierarchyDepth, tickTreeLayout.depth - node.depth);

        const root = tickTreeLayout.nodes[0];
        if (!root?.children.length) {
            return storeResult({
                ticks: ticksToRender,
                positions: tickPositions,
                depthsMap: this.buildDepthsMap(ticksToRender),
            });
        }

        // Clear keptByDepth arrays
        const keptByDepth = this.ftdByDepth;
        for (const entry of keptByDepth) {
            entry.positions.length = 0;
            entry.ticks.length = 0;
        }

        const isTooCloseToLast = (positions: number[], position: number) => {
            const last = positions.at(-1);
            return last != null && position - last < MIN_CATEGORY_SPACING;
        };

        const canKeepPosition = (position: number, depth: number) => {
            for (let d = depth + 1; d <= maxHierarchyDepth; d++) {
                if (isTooCloseToLast(keptByDepth[d].positions, position)) {
                    return false;
                }
            }
            return !isTooCloseToLast(keptByDepth[depth].positions, position);
        };

        const keepPosition = (position: number, tickLabel: GroupedCategoryKey, depth: number) => {
            const entries = keptByDepth[depth];
            entries.positions.push(position);
            entries.ticks.push(tickLabel);
        };

        const removeLowerDepthTicks = (position: number, depth: number) => {
            if (depth === 0) return;
            for (let d = 0; d < depth; d++) {
                const entries = keptByDepth[d];
                while (entries.positions.length > 0 && position - entries.positions.at(-1)! < MIN_CATEGORY_SPACING) {
                    keptTicks.delete(entries.ticks.at(-1)!);
                    entries.positions.pop();
                    entries.ticks.pop();
                }
            }
        };

        for (let i = root.children.length - 1; i >= 0; i--) {
            const node = root.children[i];
            const tickLabel = leafNodeToKey.get(node.leftmostLeaf);
            if (tickLabel != null && candidateTicks.has(tickLabel)) {
                stack.push(node);
            }
        }

        while (stack.length) {
            const node = stack.pop()!;
            const tickLabel = leafNodeToKey.get(node.leftmostLeaf);
            if (tickLabel == null || !candidateTicks.has(tickLabel)) continue;
            const position = getPosition(tickLabel);
            if (position == null || !Number.isFinite(position)) continue;

            if (keptTicks.has(tickLabel)) {
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push(node.children[i]);
                }
                continue;
            }

            const depth = getHierarchyDepth(node);
            if (canKeepPosition(position, depth)) {
                keptTicks.add(tickLabel);
                keepPosition(position, tickLabel, depth);
                removeLowerDepthTicks(position, depth);
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push(node.children[i]);
                }
            }
        }

        for (const tickLabel of ticksToRender) {
            if (tickNodes.has(tickLabel)) continue;
            const position = getPosition(tickLabel);
            if (position == null || !Number.isFinite(position)) continue;
            if (keptTicks.has(tickLabel)) continue;
            const depth = 0;
            if (canKeepPosition(position, depth)) {
                keptTicks.add(tickLabel);
                keepPosition(position, tickLabel, depth);
                removeLowerDepthTicks(position, depth);
            }
        }

        const resultTicks = ticksToRender.filter((tickLabel) => keptTicks.has(tickLabel));
        return storeResult({
            ticks: resultTicks,
            positions: tickPositions,
            depthsMap: this.buildDepthsMap(resultTicks),
        });
    }

    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     * Supposed to be called _manually_ after changing _any_ of the axis properties.
     * This allows to bulk set axis properties before updating the nodes.
     * The node changes made by this method are rendered on the next animation frame.
     * We could schedule this method call automatically on the next animation frame
     * when any of the axis properties change (the way we do when properties of scene graph's
     * nodes change), but this will mean that we first wait for the next animation
     * frame to make changes to the nodes of the axis, then wait for another animation
     * frame to render those changes. It's nice to have everything update automatically,
     * but this extra level of async indirection will not just introduce an unwanted delay,
     * it will also make it harder to reason about the program.
     */
    override update() {
        if (!this.computedLayout) return;

        // Skip animations only when the domain changes (not on initial load or other updates)
        if (!this.scale.animatable) {
            this.moduleCtx.animationManager.skipCurrentBatch();
        }

        const { tickScale, tick, gridLine, gridLength, visibleRange, tickTreeLayout } = this;
        if (!tickTreeLayout) return;

        const { tickSizeAtDepth, spacing } = this.computedLayout;
        const { depth: maxDepth } = tickTreeLayout;
        const scrollbar = this.chartLayout?.scrollbars?.[this.id];
        const scrollbarThickness = this.getScrollbarThickness(scrollbar);
        const tickSpacing = this.getTickSpacing();

        const { position, horizontal, gridPadding } = this;
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;
        const p1 = gridPadding;
        const p2 = direction * gridLength - gridPadding;

        const tickParams: ScaleTickParams<number> = {
            nice: [false, false],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };

        let { ticks: rawTicks } = tickScale.ticks(tickParams, undefined, visibleRange);
        const filteredTicks = this.filterTicksTopDown(rawTicks, visibleRange);
        rawTicks = filteredTicks.ticks;

        const { depthsMap } = filteredTicks;
        const tickDepth = (tickLabel: GroupedCategoryKey) => depthsMap.get(tickLabel) ?? maxDepth - 1;

        const gridLineData = rawTicks.map(
            (t, index): GridLineStyleTickDatum => ({
                index: tickScale.findIndex(t)!,
                tickId: createDatumId(index, ...t),
                translation: Math.round(filteredTicks.positions?.get(t) ?? tickScale.convert(t)),
            })
        );

        this.gridLineGroupSelection.update(
            gridLine.enabled && gridLength ? this.calculateGridLines(gridLineData, p1, p2) : []
        );
        this.gridFillGroupSelection.update(
            gridLine.enabled && gridLength ? this.calculateGridFills(gridLineData, p1, p2) : []
        );
        this.tickLineGroupSelection.update(
            tick.enabled
                ? rawTicks.map((tickLabel, index) => {
                      const { tickId, translation: offset } = gridLineData[index];
                      const depth = tickDepth(tickLabel);

                      const tickOptions = this.depthOptions[depth]?.tick;
                      const tickSize = tickSizeAtDepth[depth] ?? 0;

                      const stroke = tickOptions?.stroke ?? tick.stroke;
                      const strokeWidth = tickOptions?.enabled === false ? 0 : tickOptions?.width ?? tick.width;
                      const h = -direction * tickSize;
                      const tickOffset = -direction * (scrollbarThickness + tickSpacing);
                      const [x1, y1, x2, y2] = horizontal
                          ? [offset, tickOffset, offset, tickOffset + h]
                          : [tickOffset, offset, tickOffset + h, offset];
                      const lineDash = undefined;
                      return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
                  })
                : []
        );

        this.updatePosition();
        this.updateCategoryLabels();
        this.updateAxisLine();
        this.updateGridLines();
        this.updateGridFills();
        this.updateTickLines();
        this.updateTitle(this.scale.domain, spacing);
        this.updateCrossLines();
        this.resetSelectionNodes();
    }

    override calculateLayout(_primaryTickCount?: AxisPrimaryTickCount, chartLayout?: ChartLayout) {
        this.chartLayout = chartLayout;
        const { tickSizeAtDepth, tickLabelLayout, spacing, bbox } = this.computeLayout();
        this.computedLayout = { tickSizeAtDepth, tickLabelLayout, spacing };
        return { bbox, niceDomain: this.scale.domain };
    }

    /**
     * The length of the grid. The grid is only visible in case of a non-zero value.
     */
    override onGridVisibilityChange() {
        super.onGridVisibilityChange();
        this.tickLabelGroupSelection.clear();
    }

    protected override updateScale() {
        super.updateScale();
        this.tickScale.range = this.scale.range;
        // Outer padding must equal half inner padding to keep groups center point aligned.
        this.scale.paddingOuter = this.scale.paddingInner / 2;
    }

    override processData() {
        const { direction } = this;
        const flatDomains = this.boundSeries
            .filter((s) => s.visible)
            .flatMap((series) => extractDomain(series.getDomain(direction)));

        this.dataDomain = { domain: extent(flatDomains) ?? this.filterDuplicateArrays(flatDomains), clipped: false };
        if (this.isReversed()) {
            this.dataDomain = { ...this.dataDomain, domain: this.dataDomain.domain.toReversed() };
        }

        const domain: GroupedCategoryKey[] = this.dataDomain.domain.map(convertIntegratedCategoryValue);

        const { layout, tickNodes } = treeLayout(domain);
        this.tickTreeLayout = layout;
        this.tickNodes = tickNodes;
        this.leafNodeToKey = new Map<TreeNode, GroupedCategoryKey>();
        for (const [key, node] of tickNodes) {
            this.leafNodeToKey.set(node, key);
        }
        this.filterTickCache = undefined;
        this.ftdByDepth = Array.from({ length: Math.max(0, layout.depth - 1) + 1 }, () => ({
            positions: [] as number[],
            ticks: [] as GroupedCategoryKey[],
        }));

        const orderedDomain: GroupedCategoryKey[] = [];
        for (const node of this.tickTreeLayout.nodes) {
            if (node.leafCount || node.refId == null) continue;
            orderedDomain.push(this.dataDomain.domain[node.refId]);
        }

        const sortedDomain = sortBasedOnArray(this.dataDomain.domain, orderedDomain);
        this.scale.domain = sortedDomain;

        const tickScaleDomain = sortedDomain.map(convertIntegratedCategoryValue);
        tickScaleDomain.push(['']); // Add an empty tick for the last label.
        this.tickScale.domain = tickScaleDomain;
    }

    filterDuplicateArrays(array: GroupedCategoryKey[]): GroupedCategoryKey[] {
        const seen = new Set<string>();
        return array.filter((item) => {
            const key = isArray(item) ? JSON.stringify(item) : item;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

function convertIntegratedCategoryValue(datum: unknown): GroupedCategoryKey {
    // Handle integrated charts data when provided as an object
    return toArray(isObject(datum) && 'value' in datum ? datum.value : datum);
}
