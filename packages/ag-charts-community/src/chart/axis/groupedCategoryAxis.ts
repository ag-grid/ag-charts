import type { FontStyle, FontWeight } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { BandScale } from '../../scale/bandScale';
import { BBox } from '../../scene/bbox';
import { TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { extent, sortBasedOnArray, unique } from '../../util/array';
import { iterate } from '../../util/iterator';
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
import type { LabelNodeDatum, TickDatum } from './axis';
import { CategoryAxis } from './categoryAxis';
import type { TreeLayout } from './tree';
import { treeLayout } from './tree';

type TreeNode = TreeLayout['nodes'][number];

interface ComputedGroupAxisLayout {
    tickLabelLayout: LabelNodeDatum[];
    separatorLayout: number[];
}

class DepthLabelProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(COLOR_STRING, { optional: true })
    color?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    padding?: number;

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
    readonly tickScale = new BandScale<string[]>();

    private tickTreeLayout?: TreeLayout;

    @Validate(OBJECT_ARRAY, { optional: true })
    depthOptions = new PropertiesArray(DepthProperties);

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx);

        this.includeInvisibleDomains = true;
        this.tickScale.paddingInner = 1;
        this.tickScale.paddingOuter = 0;
    }

    private resizeTickTree() {
        if (!this.tickTreeLayout) return;

        const { range, step, inset, bandwidth } = this.scale;
        const lineHeight = TextUtils.getLineHeight(this.label.fontSize!);

        const width = Math.abs(range[1] - range[0]) - step;
        const height = this.tickTreeLayout.depth * lineHeight;

        this.tickTreeLayout.resize(width, height, inset + bandwidth / 2, range[0] > range[1]);
    }

    private computedLayout: ComputedGroupAxisLayout | undefined;

    private updateCategoryLabels() {
        if (!this.computedLayout) return;
        this.tickLabelGroupSelection
            .update(this.computedLayout.tickLabelLayout)
            .each((node, datum) => node.setProperties(datum));
    }

    private updateAxisLine() {
        if (!this.computedLayout) return;

        this.lineNode.stroke = this.line.stroke;
        this.lineNode.strokeWidth = this.line.width;
    }

    private computeLayout() {
        this.updateDirection();
        this.calculateDomain();
        this.updateScale();
        this.updateRange();

        const { scale, label, range, title } = this;

        const { step } = scale;
        const keepEvery = Math.ceil(label.fontSize! / step);
        const rotation = toRadians(this.rotation);
        const isHorizontal = Math.abs(Math.cos(rotation)) < 1e-8;
        const sideFlag = label.getSideFlag();

        // The Text `node` of the Caption is not used to render the title of the grouped category axis.
        // The phantom root of the tree layout is used instead.
        const lineHeight = TextUtils.getLineHeight(label.fontSize!);

        // Render ticks and labels.
        const { tickTreeLayout, depthOptions } = this;
        const maxDepth = tickTreeLayout?.depth ?? 0;
        const treeLabels = tickTreeLayout?.nodes ?? [];
        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const { defaultRotation, configuredRotation, parallelFlipFlag } = calculateLabelRotation({
            rotation: label.rotation,
            parallel: label.parallel,
            regularFlipRotation: normalizeAngle360(rotation - Math.PI / 2),
            parallelFlipRotation: normalizeAngle360(rotation),
        });

        const tickLabelLayout: LabelNodeDatum[] = [];
        const labelBBoxes: Map<number, BBox> = new Map();
        const tempText: TransformableText & { padding?: number } = new TransformableText();

        const setLabelProps = (datum: TreeNode, index: number) => {
            if (index % keepEvery !== 0 || !inRange(datum.screenX, range)) {
                return false;
            }

            const depth = maxDepth - datum.depth;
            const text = this.formatTick(datum.label, index - 1);
            const labelStyles = this.getLabelStyles({ value: text, depth }, depthOptions[depth]?.label);

            tempText.setProperties({
                ...labelStyles,
                text,
                textAlign: 'center',
                textBaseline: parallelFlipFlag === -1 ? 'bottom' : 'hanging',
                translationX: datum.screenY * -sideFlag,
                translationY: datum.screenX,
            });

            return true;
        };

        const leafPadding = depthOptions[0]?.label.padding ?? label.padding;
        let maxLeafLabelWidth = 0;

        treeLabels.forEach((datum, index) => {
            const isVisible = setLabelProps(datum, index);
            if (!isVisible || !tempText.getBBox()) return;
            const bbox = tempText.getBBox().clone();

            if (!datum.leafCount) {
                if (maxLeafLabelWidth < bbox.width) {
                    maxLeafLabelWidth = bbox.width;
                }
            }

            labelBBoxes.set(index, bbox);
        });

        const idGenerator = createIdsGenerator();

        const separatorSize: Map<number, number> = new Map();
        const registerSeparator = (k: number, v: number) => separatorSize.has(k) || separatorSize.set(k, v);

        treeLabels.forEach((datum, index) => {
            if (index === 0) return;

            const isLeaf = !datum.children.length;
            let visible = setLabelProps(datum, index);

            const labelX = sideFlag * leafPadding;

            tempText.x = labelX;
            tempText.y = 0;
            tempText.rotationCenterX = labelX;

            if (isLeaf) {
                tempText.rotation = configuredRotation;
                tempText.textAlign = 'end';
                tempText.textBaseline = 'middle';

                if (label.mirrored) {
                    tempText.translationX += labelBBoxes.get(index)?.width ?? 0;
                }
            } else {
                const availableRange = datum.leafCount * step;
                const bbox = labelBBoxes.get(index);

                if (bbox && bbox.width > availableRange) {
                    visible = false;
                    labelBBoxes.delete(index);
                } else {
                    const labelPadding = tempText.padding ?? 0;
                    // bbox?.grow(tempText.padding ?? 0, 'vertical');
                    tempText.rotation = isHorizontal ? defaultRotation : -Math.PI / 2;
                    tempText.translationX +=
                        sideFlag * (maxLeafLabelWidth + leafPadding + labelPadding) + (label.mirrored ? 0 : lineHeight);
                }
            }

            // Calculate sizes of label separators for all nodes except the root.
            if (datum.parent) {
                registerSeparator(
                    isLeaf ? datum.x : datum.x - (datum.leafCount - 1) / 2,
                    maxLeafLabelWidth + leafPadding * 2 - datum.screenY
                );
            }

            if (visible) {
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
            } else {
                labelBBoxes.delete(index);
            }
        });

        const { enabled, stroke, width } = this.line;
        this.lineNode.datum = { x: 0, y1: range[0], y2: range[1] };
        this.lineNode.setProperties({ stroke, strokeWidth: enabled ? width : 0 });

        const separatorLayout = [...separatorSize.values()];
        separatorLayout.push(separatorLayout[0]);

        const axisBoxes = [this.lineNode.getBBox(), new BBox(0, 0, separatorLayout[0] * sideFlag, 0)];

        if (title.enabled) {
            this.updateTitle(false, separatorLayout[0]);
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

        const { tickScale } = this;
        const { separatorLayout } = this.computedLayout;
        const ticksData: TickDatum[] = tickScale.ticks().map((tick, index) => ({
            tick,
            tickId: createDatumId(tick, index),
            tickLabel: tick.filter(Boolean).join(' - '),
            translationY: Math.round(tickScale.convert(tick)),
            tickSize: separatorLayout[index],
        }));

        this.gridLineGroupSelection.update(this.gridLength ? ticksData : []);
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
        return { bbox, primaryTickCount: undefined };
    }

    /**
     * The length of the grid. The grid is only visible in case of a non-zero value.
     */
    override onGridVisibilityChange() {
        this.gridLineGroupSelection.clear();
        this.tickLabelGroupSelection.clear();
    }

    protected override updateRange() {
        super.updateRange();
        this.resizeTickTree();
        this.tickScale.range = this.scale.range;
    }

    protected override calculateDomain() {
        const { direction } = this;
        const flatDomains = this.boundSeries.filter((s) => s.visible).flatMap((series) => series.getDomain(direction));
        this.setDomain(extent(flatDomains) ?? unique(flatDomains));

        const domain: string[][] = this.dataDomain.domain.map((datum) => [].concat(datum).reverse());
        this.tickTreeLayout = treeLayout(domain);

        const orderedDomain: string[][] = [];
        for (const node of this.tickTreeLayout.nodes) {
            if (node.leafCount || node.refId == null) continue;
            orderedDomain.push(this.dataDomain.domain[node.refId]);
        }

        this.scale.domain = sortBasedOnArray(this.dataDomain.domain, orderedDomain);
        this.tickScale.domain = domain.concat([['']]);
        this.resizeTickTree();
    }

    protected override updateGridLines() {
        if (!this.gridLength) return;

        const { gridLength, label, range } = this;
        const { enabled, width, style } = this.gridLine;
        const lineSize = gridLength * -label.getSideFlag();

        this.gridLineGroupSelection.each((line, datum, index) => {
            const y = datum.translationY;
            const { stroke, lineDash } = style[index % style.length];
            line.visible = enabled && y >= range[0] && y <= range[1];
            line.x1 = 0;
            line.x2 = lineSize;
            line.y1 = y;
            line.y2 = y;
            line.stroke = stroke;
            line.strokeWidth = width;
            line.lineDash = lineDash;
        });
    }

    override updateScale(opts?: { domain?: any[]; skipDomainCalculation?: boolean }): void {
        super.updateScale(opts);
        // Outer padding must equal half inner padding to keep groups center point aligned.
        this.scale.paddingOuter = this.scale.paddingInner / 2;
    }
}
