import { getMaxInnerRectSize, inRange, isArray, isObject, sortBasedOnArray, toArray } from 'ag-charts-core';
import type { FontStyle, FontWeight, TextWrap } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { GroupedCategoryScale } from '../../scale/groupedCategoryScale';
import { BBox } from '../../scene/bbox';
import { TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import { angularPadding, normalizeAngle360FromDegrees } from '../../util/angle';
import { extent } from '../../util/extent';
import { BaseProperties, PropertiesArray, Property } from '../../util/properties';
import { createIdsGenerator } from '../../util/tempUtils';
import { TextUtils } from '../../util/textMeasurer';
import { TextWrapper } from '../../util/textWrapper';
import { createDatumId } from '../data/processors';
import type { LabelNodeDatum } from './axis';
import { CategoryAxis } from './categoryAxis';
import { type TreeLayout, treeLayout } from './tree';

type TreeNode = TreeLayout['nodes'][number];

interface SeparatorDatum {
    tickSize: number;
    tickStroke?: string;
    tickWidth?: number;
}

interface ComputedGroupAxisLayout {
    tickLabelLayout: LabelNodeDatum[];
    separatorLayout: SeparatorDatum[];
    spacing: number;
}

class DepthLabelProperties extends BaseProperties {
    @Property
    enabled = true;

    @Property
    avoidCollisions?: boolean;

    @Property
    color?: string;

    @Property
    spacing?: number;

    @Property
    rotation?: number;

    @Property
    wrapping?: TextWrap;

    @Property
    truncate?: boolean;

    @Property
    fontStyle?: FontStyle;

    @Property
    fontWeight?: FontWeight;

    @Property
    fontSize?: number;

    @Property
    fontFamily?: string;
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

export class GroupedCategoryAxis extends CategoryAxis {
    static override readonly className = 'GroupedCategoryAxis';
    static override readonly type = 'grouped-category' as const;

    // Label scale (labels are positioned between ticks, tick count = label count + 1).
    // We don't call is `labelScale` for consistency with other axes.
    readonly tickScale = new GroupedCategoryScale<string[]>();

    private computedLayout?: ComputedGroupAxisLayout;
    private tickTreeLayout?: TreeLayout;

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
                          rotation: depthOptions[i]?.label.rotation ?? (i ? defaultNonLeafRotation : label.rotation), // Default top-level label roration only applies to label leaves
                          avoidCollisions: depthOptions[i]?.label.avoidCollisions ?? label.avoidCollisions,
                      }
                    : { enabled: false, spacing: 0, rotation: 0, avoidCollisions: false }
            );
        }
        return optionsMap;
    }

    private updateCategoryLabels() {
        if (!this.computedLayout) return;
        this.tickLabelGroupSelection
            .update(this.computedLayout.tickLabelLayout)
            .each((node, datum) => node.setProperties(datum));
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

        this.lineNode.datum = horizontal
            ? { x1: range[0], x2: range[1], y1: 0, y2: 0 }
            : { x1: 0, x2: 0, y1: range[0], y2: range[1] };
        this.lineNode.setProperties({ stroke: line.stroke, strokeWidth: line.enabled ? line.width : 0 });

        this.resizeTickTree();

        if (!this.tickTreeLayout?.depth) {
            return { bbox: BBox.zero, spacing: 0, separatorLayout: [], tickLabelLayout: [] };
        }

        const { depth: maxDepth, nodes: treeLabels } = this.tickTreeLayout;

        const keepEvery = Math.ceil(label.fontSize / step);
        const sideFlag = horizontal ? -label.getSideFlag() : label.getSideFlag();

        const tickLabelLayout: LabelNodeDatum[] = [];
        const labelBBoxes: Map<number, BBox> = new Map();
        const tempText = new TransformableText();

        const optionsMap = this.getDepthOptionsMap(maxDepth);
        const labelSpacing = sideFlag * optionsMap[0].spacing;

        const tickFormatter = this.tickFormatter(this.scale.domain, this.scale.domain, false);

        const setLabelProps = (datum: TreeNode, index: number) => {
            const depth = maxDepth - datum.depth;

            if (!optionsMap[depth]?.enabled || index % keepEvery !== 0 || !inRange(datum.screen, range)) {
                return false;
            }

            let text = tickFormatter(datum.label, index - 1);
            const labelStyles = this.getLabelStyles({ value: text, depth }, depthOptions[depth]?.label);

            if (label.avoidCollisions) {
                const rotation = optionsMap[depth].rotation;
                let maxWidth = (datum.leafCount || 1) * step;
                let maxHeight = this.thickness;
                if (rotation != null) {
                    const innerRect = getMaxInnerRectSize(rotation, maxWidth, maxHeight);
                    maxWidth = innerRect.width;
                    maxHeight = innerRect.height;
                }
                text =
                    TextWrapper.wrapText(text, {
                        font: labelStyles,
                        textWrap: optionsMap[depth].wrapping,
                        overflow: optionsMap[depth].truncate ? 'ellipsis' : 'hide',
                        maxWidth,
                        maxHeight,
                    }) || text;
            }

            tempText.setProperties({
                ...labelStyles,
                text,
                textAlign: 'center',
                textBaseline: label.parallel ? 'top' : 'bottom',
                lineHeight: TextUtils.getLineHeight(labelStyles.fontSize),
                x: horizontal ? datum.screen : labelSpacing,
                y: horizontal ? labelSpacing : datum.screen,
                rotation: 0,
            });

            return true;
        };

        const depthLabelMaxSize: Record<number, number> = {};
        treeLabels.forEach((datum, index) => {
            const depth = maxDepth - datum.depth;

            depthLabelMaxSize[depth] ??= 0;

            const isVisible = setLabelProps(datum, index);
            if (!isVisible || !tempText.getBBox()) return;

            labelBBoxes.set(index, tempText.getBBox());
            tempText.rotation = normalizeAngle360FromDegrees(optionsMap[depth]?.rotation);

            const { width, height } = tempText.getBBox();
            const labelSize = horizontal ? height : width;

            if (depthLabelMaxSize[depth] < labelSize) {
                depthLabelMaxSize[depth] = labelSize;
            }
        });

        const idGenerator = createIdsGenerator();
        const separatorData: Map<number, SeparatorDatum> = new Map();
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

        treeLabels.forEach((datum, index) => {
            if (index === 0) return;

            const visible = setLabelProps(datum, index);
            const isLeaf = !datum.children.length;
            const depth = maxDepth - datum.depth;

            // Calculate sizes of label separators for all nodes except the root.
            if (datum.parent) {
                const separatorX = isLeaf ? datum.position : datum.position - (datum.leafCount - 1) / 2;
                if (!separatorData.has(separatorX)) {
                    const tickOptions = this.depthOptions[depth]?.tick;
                    let v = depthLabelMaxSize[0];
                    for (let i = 0; i <= depth; i++) {
                        v += optionsMap[i].spacing;
                        if (i !== 0) {
                            v += depthLabelMaxSize[i];
                        }
                    }
                    separatorData.set(separatorX, {
                        tickSize: v,
                        tickStroke: tickOptions?.stroke,
                        tickWidth: tickOptions?.enabled !== false ? tickOptions?.width : 0,
                    });
                }
            }

            if (!visible) return;

            const labelRotation = normalizeAngle360FromDegrees(optionsMap[depth].rotation);
            const { width: w, height: h } = labelBBoxes.get(index)!;
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
                    return;
                }
            }

            const { text = '' } = tempText;
            tickLabelLayout.push({
                text,
                visible: true,
                range: this.scale.range,
                tickId: idGenerator(text),
                fill: tempText.fill as string,
                fontFamily: tempText.fontFamily,
                fontSize: tempText.fontSize,
                fontStyle: tempText.fontStyle,
                fontWeight: tempText.fontWeight,
                rotation: tempText.rotation,
                rotationCenterX: tempText.rotationCenterX,
                rotationCenterY: tempText.rotationCenterY,
                textAlign: tempText.textAlign,
                textBaseline: tempText.textBaseline,
                x: tempText.x,
                y: tempText.y,
            });
            labelBBoxes.set(index, Transformable.toCanvas(tempText));
        });

        const separatorLayout = [...separatorData.values()];
        separatorLayout.push(separatorLayout[0]);

        const bboxes = [
            this.lineNodeBBox(),
            BBox.merge(labelBBoxes.values()),
            new BBox(0, 0, separatorLayout[0].tickSize * sideFlag, 0),
        ];

        let spacing = 0;
        if (title.enabled) {
            const withoutTitle = BBox.merge(bboxes);
            spacing = horizontal ? withoutTitle.height : withoutTitle.width;
            bboxes.push(this.titleBBox(this.scale.domain, spacing));
        }

        const mergedBBox = BBox.merge(bboxes);

        this.layoutCrossLines();

        return { bbox: mergedBBox, spacing, separatorLayout, tickLabelLayout };
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

        // Category axis isn't animatable
        // As most super methods aren't called, we need to do this manually
        this.moduleCtx.animationManager.skipCurrentBatch();

        const { tickScale, tick, gridLine, gridLength } = this;
        const { separatorLayout, spacing } = this.computedLayout;

        const { position, horizontal, gridPadding } = this;
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;
        const p1 = gridPadding;
        const p2 = direction * gridLength - gridPadding;

        const ticks = tickScale
            .ticks({
                nice: false,
                interval: undefined,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            })
            .ticks.map((t, index) => ({
                tickId: createDatumId(t, index),
                offset: Math.round(tickScale.convert(t)),
            }));

        this.gridLineGroupSelection.update(
            gridLine.enabled && gridLength
                ? ticks.map(({ tickId, offset }, index) => {
                      const [x1, x2, y1, y2] = horizontal ? [offset, offset, p1, p2] : [p1, p2, offset, offset];
                      const { style, width: strokeWidth } = gridLine;
                      const { stroke, lineDash } = style[index % style.length] ?? {};
                      return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
                  })
                : []
        );
        this.tickLineGroupSelection.update(
            tick.enabled
                ? ticks.map(({ tickId, offset }, index) => {
                      const {
                          tickSize = this.getTickSize(),
                          tickStroke: stroke = tick.stroke,
                          tickWidth: strokeWidth = tick.width,
                      } = separatorLayout[index] ?? {};
                      const h = -direction * tickSize;
                      const [x1, x2, y1, y2] = horizontal ? [offset, offset, 0, h] : [0, h, offset, offset];
                      const lineDash = undefined;
                      return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
                  })
                : []
        );

        this.updatePosition();
        this.updateCategoryLabels();
        this.updateAxisLine();
        this.updateGridLines();
        this.updateTickLines();
        this.updateTitle(this.scale.domain, spacing);
        this.updateCrossLines();
        this.resetSelectionNodes();
    }

    override calculateLayout() {
        const { separatorLayout, tickLabelLayout, spacing, bbox } = this.computeLayout();
        this.computedLayout = { separatorLayout, tickLabelLayout, spacing };
        return { bbox, niceDomain: this.scale.domain };
    }

    /**
     * The length of the grid. The grid is only visible in case of a non-zero value.
     */
    override onGridVisibilityChange() {
        this.gridLineGroupSelection.clear();
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
        const flatDomains = this.boundSeries.filter((s) => s.visible).flatMap((series) => series.getDomain(direction));

        this.dataDomain = { domain: extent(flatDomains) ?? this.filterDuplicateArrays(flatDomains), clipped: false };
        if (this.isReversed()) {
            this.dataDomain.domain.reverse();
        }

        const domain: string[][] = this.dataDomain.domain.map((datum) =>
            // Handle integrated charts data when provided as an object
            toArray(isObject(datum) && 'value' in datum ? datum.value : datum)
        );

        this.tickTreeLayout = treeLayout(domain);

        const orderedDomain: string[][] = [];
        for (const node of this.tickTreeLayout.nodes) {
            if (node.leafCount || node.refId == null) continue;
            orderedDomain.push(this.dataDomain.domain[node.refId]);
        }

        this.scale.domain = sortBasedOnArray(this.dataDomain.domain, orderedDomain);
        this.tickScale.domain = domain.concat([['']]);
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
