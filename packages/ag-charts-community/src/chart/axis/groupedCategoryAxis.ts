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
import { type TreeLayout, treeLayout } from './tree';

export const MIN_CATEGORY_SPACING = 5;

type TreeNode = TreeLayout['nodes'][number];

interface ComputedGroupAxisLayout {
    tickLabelLayout: LabelNodeDatum[];
    depthLabelMaxSize: Record<number, number>;
    spacing: number;
}

interface TickInfo {
    tickLabel: string[];
    depth: number;
    position: number;
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

export class GroupedCategoryAxis extends CategoryAxis<GroupedCategoryScale<string[]>> {
    static override readonly className = 'GroupedCategoryAxis';
    static override readonly type = 'grouped-category' as const;

    // Label scale (labels are positioned between ticks, tick count = label count + 1).
    // We don't call is `labelScale` for consistency with other axes.
    readonly tickScale = new GroupedCategoryScale<string[]>();

    private computedLayout?: ComputedGroupAxisLayout = undefined;
    private tickTreeLayout?: TreeLayout = undefined;
    private tickNodes?: Map<string[], TreeNode> = undefined;

    @Property
    depthOptions = new PropertiesArray(DepthProperties);

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new GroupedCategoryScale<string[]>());

        this.includeInvisibleDomains = true;
        this.tickScale.paddingInner = 1;
        this.tickScale.paddingOuter = 0;
    }

    private resizeTickTree() {
        if (!this.tickTreeLayout) return;

        const { nodes } = this.tickTreeLayout;
        const { range, step, inset, bandwidth } = this.scale;

        const width = Math.abs(range[1] - range[0]) - step;
        const scaling = this.tickTreeLayout.scaling(width, range[0] > range[1]);
        const shift = inset + bandwidth / 2;

        let offset = 0;
        for (const node of nodes) {
            const screen = node.position * scaling;
            if (offset > screen) {
                offset = screen;
            }
            node.screen = screen + shift;
        }

        // Normalize so that root top and leftmost leaf starts at zero.
        for (const node of nodes) {
            node.screen -= offset;
        }
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

        this.lineNode.datum = horizontal
            ? { x1: range[0], x2: range[1], y1: 0, y2: 0 }
            : { x1: 0, x2: 0, y1: range[0], y2: range[1] };
        this.lineNode.setProperties({ stroke: line.stroke, strokeWidth: line.enabled ? line.width : 0 });

        this.resizeTickTree();

        if (!this.tickTreeLayout?.depth) {
            return { bbox: BBox.zero, spacing: 0, depthLabelMaxSize: {}, tickLabelLayout: [] };
        }

        const { depth: maxDepth, nodes: treeLabels } = this.tickTreeLayout;
        const sideFlag = horizontal ? -label.getSideFlag() : label.getSideFlag();

        const tickLabelLayout: LabelNodeDatum[] = [];
        const labelBBoxes: Map<number, BBox> = new Map();
        const truncatedLabelText: Map<number, string> = new Map();
        const tempText = new TransformableText();

        const optionsMap = this.getDepthOptionsMap(maxDepth);
        const labelSpacing = sideFlag * (optionsMap[0].spacing + scrollbarThickness);

        const tickFormatter = this.tickFormatter(this.scale.domain, this.scale.domain, false);

        const setLabelProps = (datum: TreeNode, index: number) => {
            const depth = maxDepth - datum.depth;

            if (!optionsMap[depth]?.enabled || !inRange(datum.screen, range)) return false;

            let maxWidth = (datum.leafCount || 1) * step;

            if (maxWidth < MIN_CATEGORY_SPACING) return false;

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

            if (text !== inputText && isTruncated(text)) {
                truncatedLabelText.set(index, toPlainText(inputText));
            } else {
                truncatedLabelText.delete(index);
            }

            tempText.x = horizontal ? datum.screen : labelSpacing;
            tempText.y = horizontal ? labelSpacing : datum.screen;
            tempText.rotation = 0;
            tempText.fill = labelStyles.color;
            tempText.text = text;
            tempText.textAlign = 'center';
            tempText.textBaseline = label.parallel ? 'top' : 'bottom';
            tempText.setFont(labelStyles);
            tempText.setBoxing(labelStyles);

            return true;
        };

        const depthLabelMaxSize: Record<number, number> = {};
        for (const [index, datum] of treeLabels.entries()) {
            const depth = maxDepth - datum.depth;
            depthLabelMaxSize[depth] ??= 0;

            const isLeaf = !datum.children.length;
            if (isLeaf && step < MIN_CATEGORY_SPACING) continue;

            const isVisible = setLabelProps(datum, index);
            if (!isVisible || !tempText.getBBox()) continue;

            labelBBoxes.set(index, tempText.getBBox());
            tempText.rotation = normalizeAngle360FromDegrees(optionsMap[depth]?.rotation);

            const { width, height } = tempText.getBBox();
            const labelSize = horizontal ? height : width;

            if (depthLabelMaxSize[depth] < labelSize) {
                depthLabelMaxSize[depth] = labelSize;
            }
        }

        const idGenerator = createIdsGenerator();
        const nestedPadding = (d: number) => {
            if (d === 0) return 0;
            let v = depthLabelMaxSize[0];
            for (let i = 1; i <= d; i++) {
                v += optionsMap[i].spacing;
                if (i !== d) {
                    v += depthLabelMaxSize[i];
                }
            }
            return v;
        };

        for (const [index, datum] of treeLabels.entries()) {
            if (index === 0) continue;

            const visible = setLabelProps(datum, index);
            const isLeaf = !datum.children.length;
            const depth = maxDepth - datum.depth;

            if (isLeaf && step < MIN_CATEGORY_SPACING) continue;
            if (!visible) continue;

            const labelRotation = normalizeAngle360FromDegrees(optionsMap[depth].rotation);
            const labelBBox = labelBBoxes.get(index);
            if (!labelBBox) continue;
            const { width: w, height: h } = labelBBox;
            const depthPadding = nestedPadding(depth);

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
                textUntruncated: truncatedLabelText.get(index),
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

        let maxTickSize = depthLabelMaxSize[0];
        for (let i = 0; i < maxDepth; i++) {
            maxTickSize += optionsMap[i].spacing;
            if (i !== 0) {
                maxTickSize += depthLabelMaxSize[i];
            }
        }

        const maxTickSizeWithScrollbar = maxTickSize + scrollbarThickness;
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

        return { bbox: mergedBBox, spacing, depthLabelMaxSize, tickLabelLayout };
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

        const { depthLabelMaxSize, spacing } = this.computedLayout;
        const { depth: maxDepth } = tickTreeLayout;
        const optionsMap = this.getDepthOptionsMap(maxDepth);
        const scrollbar = this.chartLayout?.scrollbars?.[this.id];
        const scrollbarThickness = this.getScrollbarThickness(scrollbar);

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

        const { ticks: allTicks } = tickScale.ticks(tickParams, undefined, visibleRange);
        const { tickInfos: allTickInfos, minSpacingByDepth } = buildTickInfos(
            allTicks,
            this.tickNodes,
            tickScale,
            maxDepth
        );
        const minDepthToShow = getMinDepthToShow(minSpacingByDepth);
        const visibleTickInfos = selectVisibleTickInfos(
            allTickInfos,
            minDepthToShow,
            maxDepth,
            minSpacingByDepth
        );

        const gridLineData = visibleTickInfos.map(
            ({ tickLabel, position: tickPosition }, index): GridLineStyleTickDatum => ({
                index: tickScale.findIndex(tickLabel)!,
                tickId: createDatumId(index, ...tickLabel),
                translation: Math.round(tickPosition),
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
                ? visibleTickInfos.map(({ depth }, index) => {
                      const { tickId, translation: offset } = gridLineData[index];

                      const tickOptions = this.depthOptions[depth]?.tick;
                      let tickSize = depthLabelMaxSize[0];
                      for (let i = 0; i <= depth; i++) {
                          tickSize += optionsMap[i].spacing;
                          if (i !== 0) {
                              tickSize += depthLabelMaxSize[i];
                          }
                      }

                      const stroke = tickOptions?.stroke ?? tick.stroke;
                      const strokeWidth = tickOptions?.enabled === false ? 0 : tickOptions?.width ?? tick.width;
                      const h = -direction * tickSize;
                      const tickOffset = scrollbarThickness ? -direction * scrollbarThickness : 0;
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
        const { depthLabelMaxSize, tickLabelLayout, spacing, bbox } = this.computeLayout();
        this.computedLayout = { depthLabelMaxSize, tickLabelLayout, spacing };
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
            this.dataDomain.domain.reverse();
        }

        const domain: string[][] = this.dataDomain.domain.map(convertIntegratedCategoryValue);

        const { layout, tickNodes } = treeLayout(domain);
        this.tickTreeLayout = layout;
        this.tickNodes = tickNodes;

        const orderedDomain: string[][] = [];
        for (const node of this.tickTreeLayout.nodes) {
            if (node.leafCount || node.refId == null) continue;
            orderedDomain.push(this.dataDomain.domain[node.refId]);
        }

        const sortedDomain = sortBasedOnArray(this.dataDomain.domain, orderedDomain);
        this.scale.domain = sortedDomain;

        const tickScaleDomain = sortedDomain.map(convertIntegratedCategoryValue);
        tickScaleDomain.push(['']); // Add empty tick for the last label.
        this.tickScale.domain = tickScaleDomain;
    }

    filterDuplicateArrays(array: string[][]): string[][] {
        const seen = new Set<string>();
        return array.filter((item) => {
            const key = isArray(item) ? JSON.stringify(item) : item;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

function separatorDepth2(node: TreeNode) {
    let depth = 0;
    let current: TreeNode | undefined = node;
    while (current?.index === 0) {
        depth += 1;
        current = current.parent;
    }
    return depth;
}

function buildTickInfos(
    ticks: string[][],
    tickNodes: Map<string[], TreeNode> | undefined,
    tickScale: GroupedCategoryScale<string[]>,
    maxDepth: number
): { tickInfos: TickInfo[]; minSpacingByDepth: number[] } {
    const tickInfos = new Array<TickInfo>(ticks.length);
    const minSpacingByDepth = new Array<number>(maxDepth).fill(Infinity);
    const lastPositionByDepth = new Array<number>(maxDepth).fill(Number.NaN);

    for (let i = 0; i < ticks.length; i++) {
        const tickLabel = ticks[i];
        const node = tickNodes?.get(tickLabel);
        const depth = node == null ? maxDepth - 1 : Math.min(separatorDepth2(node), maxDepth - 1);
        const position = tickScale.convert(tickLabel);
        tickInfos[i] = { tickLabel, depth, position };

        if (!Number.isFinite(position)) continue;
        for (let d = 0; d <= depth; d++) {
            const lastPosition = lastPositionByDepth[d];
            if (Number.isFinite(lastPosition)) {
                minSpacingByDepth[d] = Math.min(minSpacingByDepth[d], Math.abs(position - lastPosition));
            }
            lastPositionByDepth[d] = position;
        }
    }

    return { tickInfos, minSpacingByDepth };
}

function getMinDepthToShow(minSpacingByDepth: number[]) {
    for (let depth = 0; depth < minSpacingByDepth.length; depth++) {
        const minSpacing = minSpacingByDepth[depth];
        if (!Number.isFinite(minSpacing) || minSpacing >= MIN_CATEGORY_SPACING) {
            return depth;
        }
    }
    return minSpacingByDepth.length;
}

function selectVisibleTickInfos(
    allTickInfos: TickInfo[],
    minDepthToShow: number,
    maxDepth: number,
    minSpacingByDepth: number[]
) {
    const visibleTickInfos: TickInfo[] = [];
    const depthPresence = new Array<boolean>(maxDepth).fill(false);
    let depthCount = 0;

    for (const info of allTickInfos) {
        if (info.depth < minDepthToShow) continue;
        visibleTickInfos.push(info);
        if (!depthPresence[info.depth]) {
            depthPresence[info.depth] = true;
            depthCount++;
        }
    }

    if (depthCount > 1) {
        return visibleTickInfos;
    }

    const fallbackDepth = Math.max(0, maxDepth - 1);
    let baseTickInfos = visibleTickInfos;
    if (baseTickInfos.length === 0) {
        baseTickInfos = [];
        for (const info of allTickInfos) {
            if (info.depth >= fallbackDepth) {
                baseTickInfos.push(info);
            }
        }
    }

    const depthForSpacing = visibleTickInfos.length > 0 ? minDepthToShow : fallbackDepth;
    const minSpacing = minSpacingByDepth[depthForSpacing];
    if (!Number.isFinite(minSpacing) || minSpacing >= MIN_CATEGORY_SPACING) {
        return baseTickInfos;
    }

    const filteredBySpacing: TickInfo[] = [];
    let lastPosition = Number.NaN;
    for (const info of baseTickInfos) {
        const { position } = info;
        if (!Number.isFinite(position)) {
            filteredBySpacing.push(info);
            lastPosition = Number.NaN;
            continue;
        }
        if (!Number.isFinite(lastPosition) || Math.abs(position - lastPosition) >= MIN_CATEGORY_SPACING) {
            filteredBySpacing.push(info);
            lastPosition = position;
        }
    }

    return filteredBySpacing;
}

function convertIntegratedCategoryValue(datum: unknown): string[] {
    // Handle integrated charts data when provided as an object
    return toArray(isObject(datum) && 'value' in datum ? datum.value : datum);
}
