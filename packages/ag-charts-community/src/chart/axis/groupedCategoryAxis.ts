import type {
    AxisID,
    AxisPrimaryTickCount,
    DynamicContext,
    NormalisedGroupedCategoryAxisOptions,
    ScaleTickParams,
    WrapOptions,
} from 'ag-charts-core';
import {
    BBox,
    GroupedCategoryScale,
    PointerEvents,
    Transformable,
    TransformableText,
    angularPadding,
    createIdsGenerator,
    extent,
    extractDomain,
    fitLabelTextAutoSize,
    getMaxInnerRectSize,
    hasRealChars,
    inRange,
    isArray,
    isObject,
    isTruncated,
    labelExceedsBand,
    lineHeightAtSize,
    normalizeAngle360FromDegrees,
    sortBasedOnArray,
    tickLabelSpacing,
    toArray,
    toPlainText,
    toRadians,
    wrapTextOrSegments,
} from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import type { ChartLayout } from '../chartAxis';
import { createDatumId } from '../data/processors';
import { labelBorderInset } from '../label';
import type { ScrollbarLayout } from '../layout/layoutManager';
import type { AxisPickDatum, LabelNodeDatum } from './axis';
import { getAxisLabelSideFlag } from './axisLabelUtil';
import type { GridLineStyleTickDatum } from './cartesianAxis';
import { CategoryAxis } from './categoryAxis';
import {
    MIN_TRUNCATED_CHARS,
    axisLabelFit,
    axisLabelRotations,
    isEmptyWrap,
    isLabelFitEnabled,
    keptChars,
    labelFitsRoom,
} from './generateTicksUtils';
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

export class GroupedCategoryAxis extends CategoryAxis<
    GroupedCategoryScale<GroupedCategoryKey>,
    NormalisedGroupedCategoryAxisOptions
> {
    static override readonly className = 'GroupedCategoryAxis';
    static override readonly type = 'grouped-category' as const;

    // Label scale (labels are positioned between ticks, tick count = label count + 1).
    // We don't call is `labelScale` for consistency with other axes.
    readonly tickScale = new GroupedCategoryScale<GroupedCategoryKey>();

    private computedLayout?: ComputedGroupAxisLayout = undefined;
    private tickTreeLayout?: TreeLayout = undefined;
    private tickValues?: GroupedCategoryKey[] = undefined;
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

    constructor(moduleCtx: DynamicContext<ChartRegistry>, id: AxisID, options: NormalisedGroupedCategoryAxisOptions) {
        super(moduleCtx, id, new GroupedCategoryScale<GroupedCategoryKey>(), options);

        this.includeInvisibleDomains = true;
        this.tickScale.paddingInner = 1;
        this.tickScale.paddingOuter = 0;
    }

    private getDepthOptionsMap(maxDepth: number) {
        const optionsMap = [];
        const depthOptions = this.options.depthOptions ?? [];
        const label = this.options.label;
        const defaultNonLeafRotation = this.horizontal ? 0 : -90;
        for (let i = 0; i < maxDepth; i++) {
            const depthLabel = depthOptions[i]?.label;
            optionsMap.push(
                (depthLabel?.enabled ?? label?.enabled ?? true)
                    ? {
                          enabled: true,
                          spacing: depthLabel?.spacing ?? label?.spacing ?? 5,
                          wrapping: depthLabel?.wrapping ?? label?.wrapping,
                          truncate: depthLabel?.truncate ?? label?.truncate,
                          rotation: depthLabel?.rotation ?? (i === 0 ? label?.rotation : defaultNonLeafRotation), // Default top-level label rotation only applies to label leaves
                          alwaysShow: depthLabel?.collision?.alwaysShow ?? label?.collision.alwaysShow ?? false,
                          threshold: depthLabel?.collision?.threshold ?? label?.collision.threshold ?? 0,
                          maxWidth: depthLabel?.maxWidth ?? label?.maxWidth,
                          maxHeight: depthLabel?.maxHeight ?? label?.maxHeight,
                          minimumFontSize: depthLabel?.minimumFontSize ?? label?.minimumFontSize,
                      }
                    : { enabled: false, spacing: 0, rotation: 0, alwaysShow: true, threshold: 0 }
            );
        }
        return optionsMap;
    }

    /** Room across the axis for every depth's labels and the spacing between them, clear of any scrollbar. */
    private getGroupedLabelRoom(
        scrollbar: ScrollbarLayout | undefined,
        scrollbarThickness: number,
        tickSpacing: number
    ) {
        // `sizeLimit` already excludes `label.spacing`; `usedRoomAtDepth()` takes off every depth's own spacing.
        const room =
            (this.chartLayout?.sizeLimit ?? Infinity) +
            this.options.label.spacing -
            scrollbarThickness -
            tickSpacing -
            this.getOuterScrollbarSize(scrollbar);
        return Math.max(0, Math.floor(room));
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

        const { line } = this.options;
        this.lineNode.visible = line.enabled;
        this.lineNode.stroke = line.stroke;
        this.lineNode.strokeWidth = line.strokeWidth;
        this.lineNode.strokeOpacity = line.strokeOpacity;
        this.lineNode.lineDash = line.lineDash;
    }

    private computeLayout() {
        this.updateDirection();
        this.updateScale();

        const { step } = this.scale;
        const { range, horizontal } = this;
        const depthOptions = this.options.depthOptions ?? [];
        const line = this.options.line;
        const title = this.options.title;
        const scrollbar = this.chartLayout?.scrollbars?.[this.id];
        const scrollbarThickness = this.getScrollbarThickness(scrollbar);
        const tickSpacing = this.getTickSpacing();

        this.lineNode.datum = horizontal
            ? { x1: range[0], x2: range[1], y1: 0, y2: 0 }
            : { x1: 0, x2: 0, y1: range[0], y2: range[1] };
        this.lineNode.setProperties({
            stroke: line.stroke,
            strokeWidth: line.enabled ? line.strokeWidth : 0,
            strokeOpacity: line.strokeOpacity,
            lineDash: line.lineDash,
        });

        this.tickTreeLayout?.resize(this.scale.range, this.scale.step, this.scale.inset, this.scale.bandwidth);

        if (this.tickTreeLayout == null || this.tickTreeLayout.depth === 0) {
            this.pickTickData = [];
            return { bbox: BBox.zero, spacing: 0, tickSizeAtDepth: [], tickLabelLayout: [] };
        }

        const { depth: maxDepth, nodes: treeLabels } = this.tickTreeLayout;
        const labelSideFlag = getAxisLabelSideFlag(this.mirrored);
        const sideFlag = horizontal ? -labelSideFlag : labelSideFlag;

        const tickLabelLayout: LabelNodeDatum[] = [];
        const labelBBoxes: Map<number, BBox> = new Map();
        const tempText = new TransformableText();
        const withBorder = (bbox: BBox) => {
            const inset = labelBorderInset(tempText.getBoxingProperties());
            return inset === 0 ? bbox : bbox.clone().grow(inset);
        };

        const optionsMap = this.getDepthOptionsMap(maxDepth);
        const labelSpacing = sideFlag * (optionsMap[0].spacing + scrollbarThickness + tickSpacing);

        const tickFormatter = this.tickFormatter(this.scale.domain, this.scale.domain, false);

        // Fitted depths share the room across the axis, so they are laid out leaf-first to know what is left.
        const fitsRoom = optionsMap.some((options) => options.enabled && labelFitsRoom(options));
        const labelRoom = fitsRoom ? this.getGroupedLabelRoom(scrollbar, scrollbarThickness, tickSpacing) : 0;
        const labelOrder = fitsRoom
            ? Array.from(treeLabels.keys()).sort((a, b) => treeLabels[b].depth - treeLabels[a].depth)
            : treeLabels.keys();
        // Every depth adds its spacing to the axis, so all of it is set aside before fitting any label.
        let totalSpacing = 0;
        for (const options of optionsMap) totalSpacing += options.spacing;
        const usedRoomAtDepth = (depth: number) => {
            let used = totalSpacing;
            for (let d = 0; d < depth; d++) used += depthLabelMaxSize[d] ?? 0;
            return used;
        };

        // First pass: measure labels and cache computed text/styles
        type LabelCacheEntry = { text: any; styles: any; truncatedText: string | undefined };
        type LabelCandidate = { index: number; datum: TreeNode; depth: number; value: any; inputText: any };
        type FittedLabel = LabelCacheEntry & {
            bbox: BBox;
            exceedsBand: boolean;
            across: number;
            alongSize: number;
            dropped: number;
        };
        const labelDataCache = new Map<number, LabelCacheEntry>();
        const depthLabelMaxSize: Record<number, number> = {};
        const pickIdentities: (Omit<AxisPickDatum, 'cross'> & { depth: number })[] = [];
        const candidates: LabelCandidate[] = [];
        const candidatesAtDepth: LabelCandidate[][] = optionsMap.map(() => []);
        for (const index of labelOrder) {
            const datum = treeLabels[index];
            const depth = maxDepth - datum.depth;
            depthLabelMaxSize[depth] ??= 0;

            if (!optionsMap[depth]?.enabled || !inRange(datum.screen, range)) continue;

            const tickIndex = index - 1;
            const value = (datum.refId == null ? undefined : this.tickValues?.[datum.refId]) ?? [];
            const inputText = tickFormatter(value, tickIndex, depth);
            const alongHalfWidth = ((datum.leafCount === 0 ? 1 : datum.leafCount) * step) / 2;
            pickIdentities.push({
                index: tickIndex,
                value,
                formattedValue: inputText,
                along: [datum.screen - alongHalfWidth, datum.screen + alongHalfWidth],
                depth,
            });

            const isLeaf = datum.children.length === 0;
            if (isLeaf && step < MIN_CATEGORY_SPACING) continue;
            const bandSize = (datum.leafCount === 0 ? 1 : datum.leafCount) * step;
            if (bandSize < MIN_CATEGORY_SPACING) continue;

            const candidate = { index, datum, depth, value, inputText };
            candidates.push(candidate);
            candidatesAtDepth[depth].push(candidate);
        }

        // The size along the axis a label keeps within, leaving the collision threshold to its neighbours.
        const bandRoomAt = (depth: number, bandSize: number, rotation: number) =>
            Math.max(0, bandSize - tickLabelSpacing(optionsMap[depth].threshold, Math.cos(rotation) < 1 - 1e-9));

        // Truncation fits a label to the room, and to its band only when `toBand` is set. A `centred` label stays
        // centred on its anchor rather than shifting inward from the chart edge.
        const fitLabel = (
            { index, datum, depth, value, inputText }: LabelCandidate,
            rotation: number,
            toBand = false,
            centred = false
        ): FittedLabel | undefined => {
            const depthOptionsAt = optionsMap[depth];
            const bandSize = (datum.leafCount === 0 ? 1 : datum.leafCount) * step;
            const bandRoom = bandRoomAt(depth, bandSize, normalizeAngle360FromDegrees(rotation));
            const room = labelRoom - usedRoomAtDepth(depth);
            const baseStyles = this.getLabelStyles(
                { value, formattedValue: inputText, depth, index: index - 1 },
                depthOptions[depth]?.label
            );
            const fitToRoom = (along: number) =>
                fitLabelTextAutoSize(
                    inputText,
                    axisLabelFit(
                        { ...baseStyles, ...depthOptionsAt },
                        !horizontal,
                        room,
                        along,
                        rotation,
                        depthOptionsAt.wrapping
                    ),
                    baseStyles
                );
            const measure = (text: any, styles: typeof baseStyles) => {
                tempText.x = horizontal ? datum.screen : labelSpacing;
                tempText.y = horizontal ? labelSpacing : datum.screen;
                tempText.rotation = 0;
                tempText.fill = styles.color;
                tempText.text = text;
                tempText.textAlign = 'center';
                tempText.textBaseline = this.parallel ? 'top' : 'bottom';
                tempText.setFont(styles);
                tempText.setBoxing(styles);
                const bbox = withBorder(tempText.getBBox());
                if (bbox == null) return;
                tempText.rotation = normalizeAngle360FromDegrees(rotation);
                const turned = withBorder(tempText.getBBox());
                const across = horizontal ? turned.height : turned.width;
                const alongSize = horizontal ? turned.width : turned.height;
                return { text, styles, bbox, across, alongSize, exceedsBand: labelExceedsBand(alongSize, bandRoom) };
            };

            const measureFitted = (fitted: { text: any; fontSize?: number }) => {
                if (!hasRealChars(fitted.text)) return;
                const styles =
                    fitted.fontSize == null
                        ? baseStyles
                        : {
                              ...baseStyles,
                              fontSize: fitted.fontSize,
                              lineHeight: lineHeightAtSize(baseStyles, fitted.fontSize),
                          };
                return measure(fitted.text, styles);
            };

            // Labels are only wrapped to their band when they must keep within it.
            const wrapBand = depthOptionsAt.alwaysShow ? Infinity : bandRoom;
            let measured: ReturnType<typeof measure>;
            if (isLabelFitEnabled(depthOptionsAt)) {
                let fitted = fitToRoom(wrapBand);
                if (!hasRealChars(fitted.text) || isTruncated(fitted.text)) fitted = fitToRoom(Infinity);
                measured = measureFitted(fitted);
            } else {
                const { width: maxWidth, height: maxHeight } = getMaxInnerRectSize(
                    rotation,
                    wrapBand,
                    this.options.thickness
                );
                const wrapOptions: WrapOptions = {
                    font: baseStyles,
                    lineHeight: baseStyles.lineHeight,
                    textWrap: depthOptionsAt.wrapping,
                    overflow: 'hide',
                    maxWidth,
                    maxHeight,
                };
                const wrapped = wrapTextOrSegments(inputText, wrapOptions);
                measured = measure(isEmptyWrap(wrapped) ? inputText : wrapped, baseStyles);
                if (measured != null && depthOptionsAt.truncate === true && measured.across > room) {
                    measured = measureFitted(fitToRoom(Infinity));
                }
            }

            // Labels running along the axis shift inward to stay within the chart; turned ones are centred on
            // their group, so each may reach as far either side as its nearer chart edge.
            const alongBounds = this.chartLayout?.alongBounds;
            const truncates = depthOptionsAt.truncate === true;
            let along = Infinity;
            if (alongBounds != null && truncates) {
                along =
                    labelSlides(rotation, horizontal) && !centred
                        ? alongBounds[1] - alongBounds[0]
                        : 2 * Math.min(datum.screen - alongBounds[0], alongBounds[1] - datum.screen);
                along = Math.max(0, along);
            }
            if (measured != null && measured.alongSize > along) measured = measureFitted(fitToRoom(along));
            if (toBand && truncates && measured?.exceedsBand) {
                const minChars = Math.min(MIN_TRUNCATED_CHARS, keptChars(inputText));
                measured = measureFitted(fitToRoom(Math.min(along, bandRoom)));
                if (measured != null && keptChars(measured.text) < minChars) return;
            }
            if (measured == null) return;

            const { text } = measured;
            const truncated = text !== inputText && isTruncated(text);
            const plainText = toPlainText(inputText);
            const dropped = truncated ? Math.max(1, plainText.length - toPlainText(text).length + 1) : 0;
            return { ...measured, truncatedText: truncated ? plainText : undefined, dropped };
        };

        // Each depth takes the first rotation whose labels all fit whole within their bands, else the one
        // truncating the fewest characters, else the one with the fewest labels overflowing their bands.
        const depthRotation: number[] = [];
        const depthFits: Map<LabelCandidate, FittedLabel | undefined>[] = [];
        const fitDepth = (depth: number) => {
            const rotations = axisLabelRotations(optionsMap[depth].rotation);
            let best: { rotation: number; fits: Map<LabelCandidate, FittedLabel | undefined> } | undefined;
            let bestScore: [number, number] = [Infinity, Infinity];
            for (const rotation of rotations) {
                const fits = new Map<LabelCandidate, FittedLabel | undefined>();
                let overflowing = 0;
                let dropped = 0;
                for (const candidate of candidatesAtDepth[depth]) {
                    const fitted = fitLabel(candidate, rotation);
                    fits.set(candidate, fitted);
                    if (fitted == null) {
                        dropped += toPlainText(candidate.inputText).length;
                    } else {
                        dropped += fitted.dropped;
                        if (fitted.exceedsBand) overflowing++;
                    }
                }
                if (overflowing < bestScore[0] || (overflowing === bestScore[0] && dropped < bestScore[1])) {
                    best = { rotation, fits };
                    bestScore = [overflowing, dropped];
                }
                if (overflowing === 0 && dropped === 0) break;
            }
            depthRotation[depth] = best?.rotation ?? rotations[0];
            depthFits[depth] = best?.fits ?? new Map();
        };

        // A label's extent along the axis once shifted inward to keep it within the chart. A refitted label
        // only shrinks about its anchor or the chart edge, so this also bounds it after refitting.
        const shiftedExtent = (screen: number, alongSize: number, [lower, upper]: [number, number]) => {
            const min = screen - alongSize / 2;
            const max = screen + alongSize / 2;
            const shift = Math.max(0, lower - min) - Math.max(0, max - upper);
            return { min: min + shift, max: max + shift, shifted: shift !== 0 };
        };

        // Whether shifting a label inward leaves it clear of the other labels at its depth, wherever they end up.
        const shiftClears = ({ datum, depth }: LabelCandidate, { alongSize }: FittedLabel) => {
            const alongBounds = this.chartLayout?.alongBounds;
            if (alongBounds == null) return true;
            const { min, max, shifted } = shiftedExtent(datum.screen, alongSize, alongBounds);
            if (!shifted) return true;
            const spacing = tickLabelSpacing(optionsMap[depth].threshold, false);
            return candidatesAtDepth[depth].every((other) => {
                const otherFit = depthFits[depth].get(other);
                if (other.datum === datum || otherFit == null) return true;
                const otherExtent = shiftedExtent(other.datum.screen, otherFit.alongSize, alongBounds);
                return otherExtent.min >= max + spacing || otherExtent.max <= min - spacing;
            });
        };

        for (const candidate of candidates) {
            const { depth } = candidate;
            if (depthFits[depth] == null) fitDepth(depth);
            let fitted = depthFits[depth].get(candidate);
            const { alwaysShow, truncate } = optionsMap[depth];
            const exceedsBand = fitted?.exceedsBand === true && !alwaysShow;
            // Labels overflowing their group at the chosen rotation truncate to it before being hidden, and edge
            // labels that cannot shift inward clear of their neighbours are fitted centred on their anchor instead.
            if (
                fitted != null &&
                !alwaysShow &&
                truncate === true &&
                labelSlides(depthRotation[depth], horizontal) &&
                !shiftClears(candidate, fitted)
            ) {
                fitted = fitLabel(candidate, depthRotation[depth], exceedsBand, true);
            } else if (exceedsBand) {
                fitted = fitLabel(candidate, depthRotation[depth], true);
            }
            if (fitted == null) continue;
            const { text, styles, truncatedText, bbox, across } = fitted;
            if (depthLabelMaxSize[candidate.depth] < across) depthLabelMaxSize[candidate.depth] = across;
            labelDataCache.set(candidate.index, { text, styles, truncatedText });
            labelBBoxes.set(candidate.index, bbox);
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

        // One row per depth, stacked outwards; the outermost runs to infinity so clicks beyond the
        // labels still resolve to the group they sit under.
        this.pickTickData = pickIdentities.map(({ depth, ...identity }) => ({
            ...identity,
            depth,
            cross: [
                depth === 0 ? 0 : tickSizeAtDepth[depth - 1],
                depth === maxDepth - 1 ? Infinity : tickSizeAtDepth[depth],
            ] as const,
        }));

        // Second pass: position labels using cached data
        const idGenerator = createIdsGenerator();
        for (const [index, datum] of treeLabels.entries()) {
            if (index === 0) continue;

            const cached = labelDataCache.get(index);
            if (!cached) continue;

            const isLeaf = datum.children.length === 0;
            const depth = maxDepth - datum.depth;

            if (isLeaf && step < MIN_CATEGORY_SPACING) continue;

            const labelRotation = normalizeAngle360FromDegrees(depthRotation[depth]);
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
                        this.mirrored ? w : 0,
                        labelRotation
                    ) -
                    w / 2;
                tempText.rotationCenterX = tempText.x;
                tempText.rotationCenterY = datum.screen;
            }

            if (!optionsMap[depth].alwaysShow) {
                const { width, height } = withBorder(tempText.getBBox());
                const labelSize = horizontal ? width : height;
                const availableRange = isLeaf ? step : datum.leafCount * step;
                if (labelExceedsBand(labelSize, bandRoomAt(depth, availableRange, labelRotation))) {
                    labelBBoxes.delete(index);
                    continue;
                }
            }

            const alongBounds = this.chartLayout?.alongBounds;
            if (
                alongBounds != null &&
                optionsMap[depth].truncate === true &&
                labelSlides(depthRotation[depth], horizontal)
            ) {
                const bbox = withBorder(tempText.getBBox());
                const [min, max] = horizontal ? [bbox.x, bbox.x + bbox.width] : [bbox.y, bbox.y + bbox.height];
                const shift = Math.max(0, alongBounds[0] - min) - Math.max(0, max - alongBounds[1]);
                if (horizontal) {
                    tempText.x += shift;
                    tempText.rotationCenterX += shift;
                } else {
                    tempText.y += shift;
                    tempText.rotationCenterY += shift;
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
                lineHeight: tempText.lineHeight,
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
            labelBBoxes.set(index, withBorder(Transformable.toCanvas(tempText)));
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

        this.notifyAxisPlugins('onAxisLayout');

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
            cache?.range0 === range[0] &&
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
        if (root == null || root.children.length === 0) {
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

        while (stack.length > 0) {
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
        this.labelSource.nodeDataVersion++;

        // Skip animations only when the domain changes (not on initial load or other updates)
        if (!this.scale.animatable) {
            this.moduleCtx.animationManager.skipCurrentBatch();
        }

        const { tickScale, gridLength, visibleRange, tickTreeLayout } = this;
        const { tick, gridLine } = this.options;
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

        const gridLineData = rawTicks.map((t, index): GridLineStyleTickDatum => ({
            index: tickScale.findIndex(t)!,
            tickId: createDatumId(index, ...t),
            translation: Math.round(filteredTicks.positions?.get(t) ?? tickScale.convert(t)),
        }));

        const getDatumId = (datum: { tickId: string }) => datum.tickId;
        this.gridLineGroupSelection.update(
            gridLine.enabled && gridLength !== 0 ? this.calculateGridLines(gridLineData, p1, p2) : [],
            undefined,
            getDatumId
        );
        this.gridFillGroupSelection.update(
            gridLine.enabled && gridLength !== 0 ? this.calculateGridFills(gridLineData, p1, p2) : [],
            undefined,
            getDatumId
        );
        this.tickLineGroupSelection.update(
            tick.enabled
                ? rawTicks.map((tickLabel, index) => {
                      const { tickId, translation: offset } = gridLineData[index];
                      const depth = tickDepth(tickLabel);

                      const tickOptions = (this.options.depthOptions ?? [])[depth]?.tick;
                      const tickSize = tickSizeAtDepth[depth] ?? 0;

                      const stroke = tickOptions?.stroke ?? tick.stroke;
                      const strokeWidth = tickOptions?.enabled === false ? 0 : (tickOptions?.width ?? tick.width);
                      const h = -direction * tickSize;
                      const tickOffset = -direction * (scrollbarThickness + tickSpacing);
                      const [x1, y1, x2, y2] = horizontal
                          ? [offset, tickOffset, offset, tickOffset + h]
                          : [tickOffset, offset, tickOffset + h, offset];
                      const lineDash = undefined;
                      return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
                  })
                : [],
            undefined,
            getDatumId
        );

        this.updatePosition();
        this.updateCategoryLabels();
        this.updateAxisLine();
        this.updateGridLines();
        this.updateGridFills();
        this.updateTickLines();
        this.updateTitle(this.scale.domain, spacing);
        this.notifyAxisPlugins('onAxisUpdate');
        this.resetSelectionNodes();
    }

    protected override getDrawnTickLabels() {
        return this.computedLayout?.tickLabelLayout;
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

    // Its multi-depth layout is computed by its own `calculateLayout()`, not by the cached `calculateTickLayout()`.
    protected override get tickLayoutIgnoresData() {
        return false;
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
        this.tickValues = domain;
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
            if (node.leafCount !== 0 || node.refId == null) continue;
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

/** Whether a label turned by `rotation` degrees runs along the axis, so it can shift along it clear of its neighbours. */
function labelSlides(rotation: number, horizontal: boolean) {
    const angle = toRadians(rotation);
    return Math.abs(horizontal ? Math.cos(angle) : Math.sin(angle)) > 1 - 1e-6;
}
