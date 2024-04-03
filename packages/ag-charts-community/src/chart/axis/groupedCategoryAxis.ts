import type { ModuleContext } from '../../module/moduleContext';
import type { AgAxisCaptionFormatterParams } from '../../options/agChartOptions';
import { BandScale } from '../../scale/bandScale';
import { BBox } from '../../scene/bbox';
import { Matrix } from '../../scene/matrix';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { Text } from '../../scene/shape/text';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { extent, unique } from '../../util/array';
import { isNumber } from '../../util/type-guards';
import { BOOLEAN, COLOR_STRING, Validate } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import { AxisLabel } from './axisLabel';
import { AxisLine } from './axisLine';
import type { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
import { CategoryAxisTick } from './categoryAxis';
import type { TreeLayout } from './tree';
import { ticksToTree, treeLayout } from './tree';

class GroupedCategoryAxisLabel extends AxisLabel {
    @Validate(BOOLEAN)
    grid: boolean = false;
}

interface ComputedGroupAxisLayout {
    axisLineLayout: Partial<Line>[];
    tickLabelLayout: Partial<Text>[];
    separatorLayout: Partial<Line>[];
}

export class GroupedCategoryAxis extends CartesianAxis<BandScale<string | number>> {
    static readonly className = 'GroupedCategoryAxis';
    static readonly type = 'grouped-category' as const;

    // Label scale (labels are positioned between ticks, tick count = label count + 1).
    // We don't call is `labelScale` for consistency with other axes.
    readonly tickScale = new BandScale<string | number>();

    private gridLineSelection: Selection<Line>;
    private axisLineSelection: Selection<Line>;
    private separatorSelection: Selection<Line>;
    private labelSelection: Selection<Text>;
    private tickTreeLayout?: TreeLayout;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new BandScale<string | number>());
        this.includeInvisibleDomains = true;

        const { tickLineGroup, tickLabelGroup, gridLineGroup, tickScale, scale } = this;

        scale.paddingOuter = 0.1;
        scale.paddingInner = scale.paddingOuter * 2;
        this.refreshScale();

        tickScale.paddingInner = 1;
        tickScale.paddingOuter = 0;

        this.gridLineSelection = Selection.select(gridLineGroup, Line);
        this.axisLineSelection = Selection.select(tickLineGroup, Line);
        this.separatorSelection = Selection.select(tickLineGroup, Line);
        this.labelSelection = Selection.select(tickLabelGroup, Text);
    }

    protected override updateRange() {
        const { range: rr, visibleRange: vr, scale } = this;
        const span = (rr[1] - rr[0]) / (vr[1] - vr[0]);
        const shift = span * vr[0];
        const start = rr[0] - shift;

        this.tickScale.range = scale.range = [start, start + span];
        this.resizeTickTree();
    }

    private resizeTickTree() {
        const s = this.scale;
        const range = s.domain.length ? [s.convert(s.domain[0]), s.convert(s.domain[s.domain.length - 1])] : s.range;
        const layout = this.tickTreeLayout;
        const lineHeight = this.lineHeight;

        if (layout) {
            layout.resize(
                Math.abs(range[1] - range[0]),
                layout.depth * lineHeight,
                (Math.min(range[0], range[1]) || 0) + (s.bandwidth ?? 0) / 2,
                -layout.depth * lineHeight,
                range[1] - range[0] < 0
            );
        }
    }

    override readonly line = new AxisLine();

    override readonly label = new GroupedCategoryAxisLabel();

    private get lineHeight() {
        return this.label.fontSize * 1.5;
    }

    /**
     * The color of the labels.
     * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make labels invisible.
     */
    @Validate(COLOR_STRING, { optional: true })
    labelColor?: string = 'rgba(87, 87, 87, 1)';

    /**
     * The length of the grid. The grid is only visible in case of a non-zero value.
     */
    override onGridVisibilityChange() {
        this.gridLineSelection.clear();
        this.labelSelection.clear();
    }

    protected override createTick(): AxisTick<BandScale<string | number>, any, any> {
        return new CategoryAxisTick();
    }

    protected override calculateDomain() {
        const { direction } = this;
        let isNumericX: boolean | null = null;

        const flatDomains = this.boundSeries
            .filter((s) => s.visible)
            .flatMap((series) => {
                if (direction === ChartAxisDirection.Y || isNumericX) {
                    return series.getDomain(direction);
                }
                if (isNumericX === null) {
                    // always add first X domain
                    const domain = series.getDomain(direction);
                    isNumericX = isNumber(domain[0]);
                    return domain;
                }
                return [];
            });

        this.setDomain(extent(flatDomains) ?? unique(flatDomains));

        const { domain } = this.dataDomain;
        this.tickTreeLayout = treeLayout(ticksToTree(domain));
        this.tickScale.domain = domain.concat('');
        this.resizeTickTree();
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
    override update(): number | undefined {
        if (!this.computedLayout) {
            return;
        }

        this.updatePosition();

        this.updateTitleCaption();
        this.updateCategoryLabels();
        this.updateSeparators();
        this.updateAxisLines();
        this.updateCategoryGridLines();

        this.resetSelectionNodes();
    }

    private computedLayout: ComputedGroupAxisLayout | undefined;

    private updateTitleCaption() {
        // The Text `node` of the Caption is not used to render the title of the grouped category axis.
        // The phantom root of the tree layout is used instead.
        const { _titleCaption } = this;
        _titleCaption.node.visible = false;
    }

    private updateCategoryLabels() {
        if (!this.computedLayout) return;
        const { tickLabelLayout } = this.computedLayout;
        const labelSelection = this.labelSelection.update(tickLabelLayout);
        labelSelection.each((node, datum) => {
            node.setProperties(datum);
        });
    }

    private updateSeparators() {
        if (!this.computedLayout) return;
        const { separatorLayout } = this.computedLayout;
        const { range } = this;
        const epsilon = 0.0000001;
        const separatorSelection = this.separatorSelection.update(separatorLayout);
        separatorSelection.each((line, datum) => {
            line.x1 = datum.x1;
            line.x2 = datum.x2;
            line.y1 = datum.y;
            line.y2 = datum.y;
            line.visible = datum.y >= range[0] - epsilon && datum.y <= range[1] + epsilon;
            line.stroke = this.tick.color;
            line.fill = undefined;
            line.strokeWidth = 1;
        });
    }

    private updateAxisLines() {
        if (!this.computedLayout) return;
        const { axisLineLayout } = this.computedLayout;
        const axisLineSelection = this.axisLineSelection.update(axisLineLayout);
        axisLineSelection.each((line, datum) => {
            line.setProperties({
                ...datum,
                stroke: this.line.color,
                strokeWidth: this.line.width,
            });
            line.x1 = datum.x;
            line.x2 = datum.x;
            line.y1 = datum.y1;
            line.y2 = datum.y2;
            line.strokeWidth = this.line.width;
            line.stroke = this.line.color;
        });
    }

    private updateCategoryGridLines() {
        const { gridLength, gridLine, label, range, tickScale } = this;
        const ticks = tickScale.ticks();
        const sideFlag = label.getSideFlag();
        const gridSelection = this.gridLineSelection.update(gridLength ? ticks : []);
        if (gridLength) {
            const { width, style } = gridLine;
            const styleCount = style.length;

            gridSelection.each((line, datum, index) => {
                const y = Math.round(tickScale.convert(datum));
                line.x1 = 0;
                line.x2 = -sideFlag * gridLength;
                line.y1 = y;
                line.y2 = y;
                line.visible = y >= range[0] && y <= range[1];

                const { stroke, lineDash } = style[index % styleCount];
                line.stroke = stroke;
                line.strokeWidth = width;
                line.lineDash = lineDash;
                line.fill = undefined;
            });
        }
    }

    private computeLayout() {
        this.updateDirection();
        this.calculateDomain();
        this.updateRange();

        const {
            scale,
            label,
            label: { parallel },
            moduleCtx: { callbackCache },
            range,
            title,
            title: { formatter = (p: AgAxisCaptionFormatterParams) => p.defaultValue } = {},
        } = this;

        const rangeStart = scale.range[0];
        const rangeEnd = scale.range[1];
        const rangeLength = Math.abs(rangeEnd - rangeStart);
        const bandwidth = rangeLength / scale.domain.length || 0;
        const keepEvery = Math.ceil(label.fontSize / bandwidth);
        const rotation = toRadians(this.rotation);
        const isHorizontal = Math.abs(Math.cos(rotation)) < 1e-8;
        const sideFlag = label.getSideFlag();

        // The Text `node` of the Caption is not used to render the title of the grouped category axis.
        // The phantom root of the tree layout is used instead.
        const lineHeight = this.lineHeight;

        // Render ticks and labels.
        const tickTreeLayout = this.tickTreeLayout;
        const labels = scale.ticks();
        const treeLabels = tickTreeLayout ? tickTreeLayout.nodes : [];
        const isLabelTree = tickTreeLayout ? tickTreeLayout.depth > 1 : false;
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
            parallel,
            regularFlipRotation: normalizeAngle360(rotation - Math.PI / 2),
            parallelFlipRotation: normalizeAngle360(rotation),
        });

        const tickLabelLayout: Array<Partial<Text>> = [];

        const copyLabelProps = (node: Text): Partial<Text> => {
            return {
                fill: node.fill,
                fontFamily: node.fontFamily,
                fontSize: node.fontSize,
                fontStyle: node.fontStyle,
                fontWeight: node.fontWeight,
                rotation: node.rotation,
                rotationCenterX: node.rotationCenterX,
                rotationCenterY: node.rotationCenterY,
                text: node.text,
                textAlign: node.textAlign,
                textBaseline: node.textBaseline,
                translationX: node.translationX,
                translationY: node.translationY,
                visible: node.visible,
                x: node.x,
                y: node.y,
            };
        };

        const labelBBoxes: Map<number, BBox> = new Map();
        let maxLeafLabelWidth = 0;
        const tempText = new Text();

        const setLabelProps = (datum: (typeof treeLabels)[number], index: number) => {
            tempText.setProperties({
                fill: label.color,
                fontFamily: label.fontFamily,
                fontSize: label.fontSize,
                fontStyle: label.fontStyle,
                fontWeight: label.fontWeight,
                textAlign: 'center',
                textBaseline: parallelFlipFlag === -1 ? 'bottom' : 'hanging',
                translationX: datum.screenY - label.fontSize * 0.25,
                translationY: datum.screenX,
            });

            if (index === 0) {
                const isCaptionEnabled = title?.enabled && labels.length > 0;
                if (!isCaptionEnabled) {
                    return false;
                }
                const text = callbackCache.call(formatter, this.getTitleFormatterParams());
                tempText.setProperties({
                    fill: title.color,
                    fontFamily: title.fontFamily,
                    fontSize: title.fontSize,
                    fontStyle: title.fontStyle,
                    fontWeight: title.fontWeight,
                    text,
                    textBaseline: 'hanging',
                    translationX: datum.screenY - label.fontSize * 0.25,
                    translationY: datum.screenX,
                });
            } else if (index % keepEvery === 0) {
                const isInRange = datum.screenX >= range[0] && datum.screenX <= range[1];
                if (!isInRange) {
                    return false;
                }
                if (label.formatter) {
                    tempText.text =
                        callbackCache.call(label.formatter, {
                            value: String(datum.label),
                            index,
                        }) ?? String(datum.label);
                } else {
                    tempText.text = String(datum.label);
                }
            } else {
                return false;
            }

            return true;
        };

        treeLabels.forEach((datum, index) => {
            const isVisible = setLabelProps(datum, index);
            if (!isVisible) return;

            const bbox = tempText.computeTransformedBBox();
            if (!bbox) return;

            labelBBoxes.set(index, bbox);
            const isLeaf = !datum.children.length;
            if (isLeaf && bbox.width > maxLeafLabelWidth) {
                maxLeafLabelWidth = bbox.width;
            }
        });

        const labelX = sideFlag * label.padding;

        const labelGrid = this.label.grid;
        const separatorData: Array<{ y: number; x1: number; x2: number }> = [];
        treeLabels.forEach((datum, index) => {
            let visible = setLabelProps(datum, index);
            const id = index;
            tempText.x = labelX;
            tempText.rotationCenterX = labelX;
            const isLeaf = !datum.children.length;
            if (isLeaf) {
                tempText.rotation = configuredRotation;
                tempText.textAlign = 'end';
                tempText.textBaseline = 'middle';
            } else {
                tempText.translationX -= maxLeafLabelWidth - lineHeight + this.label.padding;
                const availableRange = datum.leafCount * bandwidth;
                const bbox = labelBBoxes.get(id);
                if (bbox && bbox.width > availableRange) {
                    visible = false;
                    labelBBoxes.delete(id);
                } else if (isHorizontal) {
                    tempText.rotation = defaultRotation;
                } else {
                    tempText.rotation = -Math.PI / 2;
                }
            }

            // Calculate positions of label separators for all nodes except the root.
            // Each separator is placed to the top of the current label.
            if (datum.parent && isLabelTree) {
                const y = isLeaf ? datum.screenX - bandwidth / 2 : datum.screenX - (datum.leafCount * bandwidth) / 2;

                if (isLeaf) {
                    if (datum.number !== datum.children.length - 1 || labelGrid) {
                        separatorData.push({
                            y,
                            x1: 0,
                            x2: -maxLeafLabelWidth - this.label.padding * 2,
                        });
                    }
                } else {
                    const x = -maxLeafLabelWidth - this.label.padding * 2 + datum.screenY;
                    separatorData.push({
                        y,
                        x1: x + lineHeight,
                        x2: x,
                    });
                }
            }

            let props: Partial<Text>;
            if (visible) {
                const bbox = tempText.computeTransformedBBox();
                if (bbox) {
                    labelBBoxes.set(index, bbox);
                }
                props = { ...copyLabelProps(tempText), visible };
            } else {
                labelBBoxes.delete(index);
                props = { visible };
            }
            tickLabelLayout.push(props);
        });

        // Calculate the position of the long separator on the far bottom of the axis.
        let minX = 0;
        separatorData.forEach((d) => (minX = Math.min(minX, d.x2)));
        separatorData.push({
            y: Math.max(rangeStart, rangeEnd),
            x1: 0,
            x2: minX,
        });

        const separatorLayout: Array<Partial<Line>> = [];
        const separatorBoxes: BBox[] = [];
        const epsilon = 0.0000001;
        separatorData.forEach((datum) => {
            if (datum.y >= range[0] - epsilon && datum.y <= range[1] + epsilon) {
                const { x1, x2, y } = datum;
                const separatorBox = new BBox(Math.min(x1, x2), y, Math.abs(x1 - x2), 0);
                separatorBoxes.push(separatorBox);
                separatorLayout.push({ x1, x2, y });
            }
        });

        const axisLineLayout: Array<Partial<Line>> = [];
        const axisLineBoxes: BBox[] = [];
        const lineCount = tickTreeLayout ? tickTreeLayout.depth + 1 : 1;
        for (let i = 0; i < lineCount; i++) {
            const visible = labels.length > 0 && (i === 0 || (labelGrid && isLabelTree));
            const x = i > 0 ? -maxLeafLabelWidth - this.label.padding * 2 - (i - 1) * lineHeight : 0;
            const lineBox = new BBox(x, Math.min(...range), 0, Math.abs(range[1] - range[0]));
            axisLineBoxes.push(lineBox);
            axisLineLayout.push({ x, y1: range[0], y2: range[1], visible });
        }

        const getTransformBox = (bbox: BBox) => {
            const matrix = new Matrix();
            const {
                rotation: axisRotation,
                translationX,
                translationY,
                rotationCenterX,
                rotationCenterY,
            } = this.getAxisTransform();
            Matrix.updateTransformMatrix(matrix, 1, 1, axisRotation, translationX, translationY, {
                scalingCenterX: 0,
                scalingCenterY: 0,
                rotationCenterX,
                rotationCenterY,
            });
            return matrix.transformBBox(bbox);
        };

        const bbox = BBox.merge([...labelBBoxes.values(), ...separatorBoxes, ...axisLineBoxes]);
        const transformedBBox = getTransformBox(bbox);

        return {
            bbox: transformedBBox,
            tickLabelLayout,
            separatorLayout,
            axisLineLayout,
        };
    }

    override calculateLayout(): { bbox: BBox; primaryTickCount: number | undefined } {
        const { axisLineLayout, separatorLayout, tickLabelLayout, bbox } = this.computeLayout();

        this.computedLayout = {
            axisLineLayout,
            separatorLayout,
            tickLabelLayout,
        };

        return { bbox, primaryTickCount: undefined };
    }
}
