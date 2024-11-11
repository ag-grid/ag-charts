import type { AgAxisCaptionFormatterParams } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { resetMotion } from '../../motion/resetMotion';
import { BandScale } from '../../scale/bandScale';
import { BBox } from '../../scene/bbox';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { extent, toArray, unique } from '../../util/array';
import { iterate } from '../../util/iterator';
import { inRange } from '../../util/number';
import { createIdsGenerator } from '../../util/tempUtils';
import { TextUtils } from '../../util/textMeasurer';
import { isNumber } from '../../util/type-guards';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import type { LabelNodeDatum } from './axis';
import { resetAxisGroupFn, resetAxisLabelSelectionFn, resetAxisLineSelectionFn } from './axisUtil';
import { CategoryAxis } from './categoryAxis';
import type { TreeLayout } from './tree';
import { treeLayout } from './tree';

interface ComputedGroupAxisLayout {
    tickLabelLayout: LabelNodeDatum[];
    separatorLayout: Partial<Line>[];
}

export class GroupedCategoryAxis extends CategoryAxis {
    static override readonly className = 'GroupedCategoryAxis';
    static override readonly type = 'grouped-category' as const;

    // Label scale (labels are positioned between ticks, tick count = label count + 1).
    // We don't call is `labelScale` for consistency with other axes.
    readonly tickScale = new BandScale<string[]>();

    private readonly separatorSelection = Selection.select(this.tickLineGroup, Line);
    private tickTreeLayout?: TreeLayout;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx);

        this.includeInvisibleDomains = true;
        this.tickScale.paddingInner = 1;
        this.tickScale.paddingOuter = 0;
    }

    private resizeTickTree() {
        if (!this.tickTreeLayout) return;

        const s = this.scale;
        const { bandwidth = 0 } = s;
        const range = s.domain.length ? [s.convert(s.domain[0]), s.convert(s.domain.at(-1)!)] : s.range;
        const lineHeight = TextUtils.getLineHeight(this.label.fontSize!);
        const { depth } = this.tickTreeLayout;

        this.tickTreeLayout.resize(
            Math.abs(range[1] - range[0]),
            depth * lineHeight,
            (Math.min(range[0], range[1]) || 0) + bandwidth / 2,
            -depth * lineHeight,
            range[1] - range[0] < 0
        );
    }

    private computedLayout: ComputedGroupAxisLayout | undefined;

    private updateTitleCaption() {
        // The Text `node` of the Caption is not used to render the title of the grouped category axis.
        // The phantom root of the tree layout is used instead.
        this.title.caption.node.visible = false;
    }

    private updateCategoryLabels() {
        if (!this.computedLayout) return;
        this.tickLabelGroupSelection
            .update(this.computedLayout.tickLabelLayout)
            .each((node, datum) => node.setProperties(datum));
    }

    private updateSeparators() {
        if (!this.computedLayout) return;
        const { enabled, stroke } = this.tick;
        this.separatorSelection.update(this.computedLayout.separatorLayout).each((line, datum) => {
            line.visible = enabled && inRange(datum.y, this.range, 1e-7);
            line.x1 = datum.x1;
            line.x2 = datum.x2;
            line.y1 = datum.y;
            line.y2 = datum.y;
            line.stroke = stroke;
            line.strokeWidth = 1;
        });
    }

    private updateAxisLines() {
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
        const formatter = title.formatter ?? ((p: AgAxisCaptionFormatterParams) => p.defaultValue);
        const reverseDirection = this.position === 'top' || this.position === 'right';

        const [rangeStart, rangeEnd] = scale.range;
        const rangeLength = Math.abs(rangeEnd - rangeStart);
        const bandwidth = rangeLength / scale.domain.length || 0;
        const keepEvery = Math.ceil(label.fontSize! / bandwidth);
        const rotation = toRadians(this.rotation);
        const isHorizontal = Math.abs(Math.cos(rotation)) < 1e-8;
        const sideFlag = label.getSideFlag();

        // The Text `node` of the Caption is not used to render the title of the grouped category axis.
        // The phantom root of the tree layout is used instead.
        const lineHeight = TextUtils.getLineHeight(label.fontSize!);

        // Render ticks and labels.
        const { tickTreeLayout } = this;
        const treeLabels = tickTreeLayout?.nodes ?? [];
        const isLabelTree = tickTreeLayout ? tickTreeLayout.depth > 1 : false;
        const isCaptionEnabled = title?.enabled && scale.domain.length > 0;
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
        const tempText = new TransformableText();

        const setLabelProps = (datum: (typeof treeLabels)[number], index: number) => {
            if (index === 0) {
                if (isCaptionEnabled) {
                    tempText.setProperties({
                        text: this.moduleCtx.callbackCache.call(formatter, this.getTitleFormatterParams()),
                        fill: title.color,
                        fontFamily: title.fontFamily,
                        fontSize: title.fontSize,
                        fontStyle: title.fontStyle,
                        fontWeight: title.fontWeight,
                        textAlign: 'center',
                        textBaseline: 'hanging',
                        translationX: reverseDirection
                            ? title.fontSize * 0.25 - datum.screenY
                            : datum.screenY - title.fontSize * 0.25,
                        translationY: datum.screenX,
                    });
                    return true;
                }
                return false;
            }

            if (index % keepEvery !== 0 || !inRange(datum.screenX, range)) {
                return false;
            }

            tempText.setProperties({
                text: this.formatTick(datum.label, index),
                fill: label.color,
                fontFamily: label.fontFamily,
                fontSize: label.fontSize,
                fontStyle: label.fontStyle,
                fontWeight: label.fontWeight,
                textAlign: 'center',
                textBaseline: parallelFlipFlag === -1 ? 'bottom' : 'hanging',
                translationX: reverseDirection
                    ? title.fontSize * 0.25 - datum.screenY
                    : datum.screenY - title.fontSize * 0.25,
                translationY: datum.screenX,
            });

            return true;
        };

        let maxLeafLabelWidth = 0;
        treeLabels.forEach((datum, index) => {
            const isVisible = setLabelProps(datum, index);
            if (!isVisible) return;

            const bbox = tempText.getBBox();
            if (!bbox) return;

            labelBBoxes.set(index, bbox);
            const isLeaf = !datum.children.length;
            if (isLeaf && maxLeafLabelWidth < bbox.width) {
                maxLeafLabelWidth = bbox.width;
            }
        });

        const labelX = sideFlag * label.padding;
        const separatorData: Array<{ y: number; x1: number; x2: number }> = [];
        const idGenerator = createIdsGenerator();

        treeLabels.forEach((datum, index) => {
            const isLeaf = !datum.children.length;
            let visible = setLabelProps(datum, index);

            tempText.x = labelX;
            tempText.y = index === 0 && isCaptionEnabled ? title.spacing ?? 0 : 0;
            tempText.rotationCenterX = labelX;

            if (reverseDirection) {
                tempText.y *= -1;
            }

            if (isLeaf) {
                tempText.rotation = configuredRotation;
                tempText.textAlign = 'end';
                tempText.textBaseline = 'middle';

                if (reverseDirection) {
                    tempText.translationX += labelBBoxes.get(index)?.width ?? 0;
                }
            } else {
                const availableRange = datum.leafCount * bandwidth;
                const bbox = labelBBoxes.get(index);

                tempText.translationX -= reverseDirection
                    ? -maxLeafLabelWidth - label.padding
                    : maxLeafLabelWidth - lineHeight + label.padding;

                if (bbox && bbox.width > availableRange) {
                    visible = false;
                    labelBBoxes.delete(index);
                } else {
                    tempText.rotation = isHorizontal ? defaultRotation : -Math.PI / 2;
                }
            }

            // Calculate positions of label separators for all nodes except the root.
            // Each separator is placed to the top of the current label.
            if (datum.parent && isLabelTree) {
                const y = isLeaf ? datum.screenX - bandwidth / 2 : datum.screenX - (datum.leafCount * bandwidth) / 2;

                if (isLeaf) {
                    if (datum.index !== datum.children.length - 1) {
                        separatorData.push(
                            reverseDirection
                                ? { y, x1: 0, x2: maxLeafLabelWidth + label.padding * 2 }
                                : { y, x1: 0, x2: -maxLeafLabelWidth - label.padding * 2 }
                        );
                    }
                } else {
                    const x = reverseDirection
                        ? maxLeafLabelWidth + label.padding * 2 - datum.screenY
                        : -maxLeafLabelWidth - label.padding * 2 + datum.screenY;

                    separatorData.push(
                        reverseDirection ? { y, x1: x - lineHeight, x2: x } : { y, x1: x + lineHeight, x2: x }
                    );
                }
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

        // Calculate the position of the long separator on the far bottom of the axis.
        separatorData.push({
            y: Math.max(rangeStart, rangeEnd),
            x1: 0,
            x2: separatorData.reduce((minX, d) => (reverseDirection ? Math.max(minX, d.x2) : Math.min(minX, d.x2)), 0),
        });

        const lineBoxes: BBox[] = [];
        const separatorLayout: Partial<Line>[] = [];

        const { enabled, stroke, width } = this.line;
        this.lineNode.datum = { x: 0, y1: range[0], y2: range[1] };
        this.lineNode.setProperties({ stroke, strokeWidth: enabled ? width : 0 });

        lineBoxes.push(this.lineNode.getBBox());

        for (const datum of separatorData) {
            if (this.inRange(datum.y, 1e-7)) {
                const { x1, x2, y } = datum;
                separatorLayout.push({ x1, x2, y });
                lineBoxes.push(new BBox(Math.min(x1, x2), y, Math.abs(x1 - x2), 0));
            }
        }

        const mergedBBox = BBox.merge(iterate(labelBBoxes.values(), lineBoxes));

        return {
            bbox: this.getTransformBox(mergedBBox),
            tickLabelLayout,
            separatorLayout,
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

        this.updatePosition();

        this.updateTitleCaption();
        this.updateCategoryLabels();
        this.updateSeparators();
        this.updateAxisLines();
        this.updateGridLines();

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
        let isNumericX: boolean | null = null;

        const flatDomains = this.boundSeries
            .filter((s) => s.visible)
            .flatMap((series) => {
                if (direction === ChartAxisDirection.Y || isNumericX) {
                    return series.getDomain(direction);
                } else if (isNumericX === null) {
                    // always add first X domain
                    const domain = series.getDomain(direction);
                    isNumericX = isNumber(domain[0]);
                    return domain;
                }
                return [];
            });

        this.setDomain(extent(flatDomains) ?? unique(flatDomains));

        const domain = this.dataDomain.domain.map(toArray);
        this.tickTreeLayout = treeLayout(domain);
        this.tickScale.domain = domain.concat([['']]);
        this.resizeTickTree();
    }

    protected override resetSelectionNodes() {
        resetMotion([this.axisGroup], resetAxisGroupFn());
        resetMotion([this.tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([this.lineNode], resetAxisLineSelectionFn());
    }

    protected override updateGridLines() {
        if (!this.gridLength) {
            this.gridLineGroupSelection.update([]);
            return;
        }

        const { gridLength, label, range, tickScale } = this;
        const { enabled, width, style } = this.gridLine;
        const gridSelection = this.gridLineGroupSelection.update(tickScale.ticks());
        const lineSize = gridLength * -label.getSideFlag();
        const styleCount = style.length;

        gridSelection.each((line, datum, index) => {
            const y = Math.round(tickScale.convert(datum));
            const { stroke, lineDash } = style[index % styleCount];
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
}
