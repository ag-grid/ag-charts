import { countLines, isArray, isObject, iterate, sortBasedOnArray, toArray } from 'ag-charts-core';
import type { FontStyle, FontWeight } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { GroupedCategoryScale } from '../../scale/groupedCategoryScale';
import { BBox } from '../../scene/bbox';
import { TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import { getAngleRatioRadians, normalizeAngle360, toRadians } from '../../util/angle';
import { extent } from '../../util/extent';
import { inRange } from '../../util/number';
import { BaseProperties, PropertiesArray } from '../../util/properties';
import { createIdsGenerator } from '../../util/tempUtils';
import { TextUtils } from '../../util/textMeasurer';
import {
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    NUMBER,
    OBJECT,
    OBJECT_ARRAY,
    POSITIVE_NUMBER,
    STRING,
    Validate,
} from '../../util/validation';
import { createDatumId } from '../data/processors';
import { calculateLabelRotation } from '../label';
import type { LabelNodeDatum } from './axis';
import type { TickDatum } from './axisUtil';
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
}

class DepthLabelProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(BOOLEAN, { optional: true })
    avoidCollisions?: boolean;

    @Validate(COLOR_STRING, { optional: true })
    color?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    spacing?: number;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @Validate(NUMBER.restrict({ min: 1 }), { optional: true })
    fontSize?: number;

    @Validate(STRING, { optional: true })
    fontFamily?: string;
}

class DepthTickProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(POSITIVE_NUMBER, { optional: true })
    width?: number;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;
}

class DepthProperties extends BaseProperties {
    @Validate(OBJECT)
    label = new DepthLabelProperties();

    @Validate(OBJECT)
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

    @Validate(OBJECT_ARRAY)
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
        const scalingX = this.tickTreeLayout.scalingX(width, range[0] > range[1]);
        const shiftX = inset + bandwidth / 2;

        let offsetX = 0;
        for (const node of nodes) {
            const screenX = node.x * scalingX;
            if (offsetX > screenX) {
                offsetX = screenX;
            }
            node.screenX = screenX + shiftX;
        }

        // Normalize so that root top and leftmost leaf starts at zero.
        for (const node of nodes) {
            node.screenX -= offsetX;
        }
    }

    private getDepthOptionsMap(maxDepth: number) {
        const optionsMap = [];
        const { depthOptions, label } = this;
        for (let i = 0; i < maxDepth; i++) {
            optionsMap.push(
                depthOptions[i]?.label.enabled ?? label.enabled
                    ? {
                          enabled: true,
                          spacing: depthOptions[i]?.label.spacing ?? label.spacing,
                          lineHeight: TextUtils.getLineHeight(depthOptions[i]?.label.fontSize ?? label.fontSize ?? 10),
                          avoidCollisions: depthOptions[i]?.label.avoidCollisions ?? label.avoidCollisions,
                      }
                    : { enabled: false, spacing: 0, lineHeight: 0, avoidCollisions: false }
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
        this.resizeTickTree();

        if (!this.tickTreeLayout?.depth) {
            return { bbox: BBox.zero, separatorLayout: [], tickLabelLayout: [] };
        }

        const { step } = this.scale;
        const { title, label, range, depthOptions } = this;
        const { depth: maxDepth, nodes: treeLabels } = this.tickTreeLayout;

        const keepEvery = Math.ceil(label.fontSize / step);
        const rotation = toRadians(this.rotation);
        const isHorizontal = this.position === 'top' || this.position === 'bottom';
        const sideFlag = label.getSideFlag();

        const tickLabelLayout: LabelNodeDatum[] = [];
        const labelBBoxes: Map<number, BBox> = new Map();
        const tempText = new TransformableText();

        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const { defaultRotation, configuredRotation } = calculateLabelRotation({
            rotation: label.rotation,
            parallel: label.parallel,
            regularFlipRotation: normalizeAngle360(rotation - Math.PI / 2),
            parallelFlipRotation: normalizeAngle360(rotation),
        });
        const labelRotation = defaultRotation + configuredRotation;
        const optionsMap = this.getDepthOptionsMap(maxDepth);

        const setLabelProps = (datum: TreeNode, index: number) => {
            const depth = maxDepth - datum.depth;

            if (!optionsMap[depth]?.enabled || index % keepEvery !== 0 || !inRange(datum.screenX, range)) {
                return false;
            }

            const text = this.formatTick(datum.label, index - 1, this.scale.domain);
            const labelStyles = this.getLabelStyles({ value: text, depth }, depthOptions[depth]?.label);

            tempText.setProperties({
                ...labelStyles,
                text,
                textAlign: 'center',
                textBaseline: label.parallel ? 'hanging' : 'bottom',
                rotation: 0,
                translationX: 0,
                translationY: datum.screenX,
            });

            return true;
        };

        let maxLeafLabelWidth = 0;
        const depthLines: Record<number, number> = {};
        treeLabels.forEach((datum, index) => {
            const depth = maxDepth - datum.depth;
            const nodeLines = countLines(datum.label);

            depthLines[depth] ??= 1;
            if (depthLines[depth] < nodeLines) {
                depthLines[depth] = nodeLines;
            }

            const isVisible = setLabelProps(datum, index);
            if (!isVisible || !tempText.getBBox()) return;
            labelBBoxes.set(index, tempText.getBBox());

            if (!datum.leafCount) {
                tempText.rotation = labelRotation;
                const { width } = tempText.getBBox();
                if (maxLeafLabelWidth < width) {
                    maxLeafLabelWidth = width;
                }
            }
        });

        const idGenerator = createIdsGenerator();
        const labelX = sideFlag * optionsMap[0].spacing;
        const separatorData: Map<number, SeparatorDatum> = new Map();
        const nestedPadding = (d: number) => {
            let v = maxLeafLabelWidth;
            for (let i = 1; i <= d; i++) {
                v += optionsMap[i].spacing;
                if (label.mirrored || i !== d) {
                    v += depthLines[i] * optionsMap[i].lineHeight;
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
                const separatorX = isLeaf ? datum.x : datum.x - (datum.leafCount - 1) / 2;
                if (!separatorData.has(separatorX)) {
                    const tickOptions = this.depthOptions[depth]?.tick;
                    let v = maxLeafLabelWidth;
                    for (let i = 0; i <= depth; i++) {
                        v += optionsMap[i].spacing;
                        if (i !== 0) {
                            v += depthLines[i] * optionsMap[i].lineHeight;
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

            tempText.x = labelX;
            tempText.y = 0;

            if (isLeaf) {
                const { width } = labelBBoxes.get(index)!;
                const angleRatio = getAngleRatioRadians(labelRotation);

                tempText.rotation = labelRotation;
                tempText.textAlign = 'end';
                tempText.textBaseline = 'middle';
                tempText.rotationCenterX = labelX - width / 2;
                tempText.translationX = ((optionsMap[depth].spacing - width) / 2) * angleRatio * sideFlag;

                if (label.mirrored) {
                    tempText.translationX += width;
                }
            } else {
                tempText.rotation = isHorizontal ? defaultRotation : -Math.PI / 2;
                tempText.rotationCenterX = labelX;
                tempText.translationX = sideFlag * nestedPadding(depth);
            }

            if (optionsMap[depth].avoidCollisions) {
                const availableRange = isLeaf ? step : datum.leafCount * step;
                if (tempText.getBBox().height > availableRange) {
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
                textAlign: tempText.textAlign,
                textBaseline: tempText.textBaseline,
                translationX: tempText.translationX,
                translationY: tempText.translationY,
                x: tempText.x,
                y: tempText.y,
            });
            labelBBoxes.set(index, Transformable.toCanvas(tempText));
        });

        const { enabled, stroke, width } = this.line;
        this.lineNode.datum = { x: 0, y1: range[0], y2: range[1] };
        this.lineNode.setProperties({ stroke, strokeWidth: enabled ? width : 0 });

        const separatorLayout = [...separatorData.values()];
        separatorLayout.push(separatorLayout[0]);

        const axisBoxes = [this.lineNode.getBBox(), new BBox(0, 0, separatorLayout[0].tickSize * sideFlag, 0)];

        if (title.enabled) {
            this.updateTitle(false, separatorLayout[0].tickSize);
            axisBoxes.push(title.caption.node.getBBox());
        }

        const mergedBBox = BBox.merge(iterate(labelBBoxes.values(), axisBoxes));

        return {
            bbox: this.getTransformBox(mergedBBox),
            separatorLayout,
            tickLabelLayout,
        };
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

        const { tickScale, gridLine, gridLength } = this;
        const { separatorLayout } = this.computedLayout;

        const ticksData: TickDatum[] = tickScale
            .ticks({
                nice: false,
                interval: undefined,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            })
            .map((tick, index) => ({
                ...separatorLayout[index],
                tick,
                tickId: createDatumId(tick, index),
                tickLabel: tick.filter(Boolean).join(' - '),
                translationY: Math.round(tickScale.convert(tick)),
            }));

        this.gridLineGroupSelection.update(gridLine.enabled && gridLength ? ticksData : []);
        this.tickLineGroupSelection.update(this.tick.enabled ? ticksData : []);

        this.updatePosition();
        this.updateCategoryLabels();
        this.updateAxisLine();
        this.updateGridLines();
        this.updateTickLines();
        this.updateTitle();

        this.resetSelectionNodes();
    }

    override calculateLayout() {
        const { separatorLayout, tickLabelLayout, bbox } = this.computeLayout();
        this.computedLayout = { separatorLayout, tickLabelLayout };
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

        return { animatable: true };
    }

    protected override updateGridLines() {
        if (!this.gridLength) return;

        const { width, style } = this.gridLine;
        const lineSize = this.gridLength * -this.label.getSideFlag();

        this.gridLineGroupSelection.each((line, datum, index) => {
            const { stroke, lineDash } = style[index % style.length];
            const y = datum.translationY;
            line.visible = this.inRange(y);
            line.x1 = 0;
            line.x2 = lineSize;
            line.y = y;
            line.stroke = stroke;
            line.strokeWidth = width;
            line.lineDash = lineDash;
        });
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
