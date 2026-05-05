import { type TextAlign, type TextOrSegments, _ModuleSupport } from 'ag-charts-community';
import type { Point } from 'ag-charts-core';

import { layoutScenesColumn, layoutScenesRow } from '../../utils/sceneLayout';
import type { OrganizationDatum, OrganizationNodeFields, RequiredOrganizationNodeStyle } from './organizationTypes';
import { applyFillStyles, applyStrokeStyles, applyTextBoxingStyles, applyTextStyles } from './organizationUtils';

export class OrganizationNode extends _ModuleSupport.TranslatableGroup<OrganizationDatum> {
    private shapeNode?: _ModuleSupport.Rect;
    private imageNode?: _ModuleSupport.Rect;
    private titleNode?: _ModuleSupport.Text;
    private subtitleNode?: _ModuleSupport.Text;
    private labelNodes?: (_ModuleSupport.Text | undefined)[];

    private expanderNode?: OrganizationExpanderNode;

    private appliedStyles?: RequiredOrganizationNodeStyle;

    update(
        fields: OrganizationNodeFields,
        descendantsCount: number,
        styles: RequiredOrganizationNodeStyle,
        isCollapsed: boolean
    ) {
        this.appliedStyles = styles;
        this.updateShapeNode(styles);
        this.updateImageNode(fields.image, styles);
        this.updateTitleNode(fields.title, styles);
        this.updateSubtitleNode(fields.subtitle, styles);
        this.updateLabelNodes(fields.labels, styles);
        this.updateExpanderNode(descendantsCount, isCollapsed, styles);

        let rowScenes = [];
        let rowGaps: number[] = [];

        const columnScenes = [];
        const columnGaps: number[] = [];

        if (this.imageNode && styles.image.position === 'top') {
            this.imageNode.x = styles.padding;
            columnScenes.push(this.imageNode);
            columnGaps.push(styles.image.spacing);
        }

        if (this.titleNode) {
            columnScenes.push(this.titleNode);
            columnGaps.push(styles.title.spacing);
        }

        if (this.subtitleNode) {
            columnScenes.push(this.subtitleNode);
            columnGaps.push(styles.subtitle.spacing);
        }

        let index = 0;
        for (const labelNode of this.labelNodes ?? []) {
            if (!labelNode) {
                index++;
                continue;
            }
            columnScenes.push(labelNode);
            columnGaps.push(styles.labels[index].spacing);
            index++;
        }

        if (this.imageNode && styles.image.position === 'bottom') {
            this.imageNode.x = styles.padding;
            columnScenes.push(this.imageNode);
            columnGaps.push(styles.image.spacing);
        }

        if (this.imageNode && styles.image.position === 'left') {
            this.imageNode.y = styles.padding;
            rowScenes = [this.imageNode, columnScenes];
            rowGaps = [styles.image.spacing];
        } else if (this.imageNode && styles.image.position === 'right') {
            this.imageNode.y = styles.padding;
            rowScenes = [columnScenes, this.imageNode];
            rowGaps = [styles.image.spacing];
        } else {
            rowScenes = [columnScenes];
        }

        layoutScenesColumn(columnScenes, styles.padding, columnGaps);
        layoutScenesRow(rowScenes, styles.padding, rowGaps);

        // For parent nodes the pill intrudes up into the card by half its height, so the
        // effective bottom content padding must be at least `height/2 + spacing` to keep
        // the last label clear of the pill.  Leaf nodes use plain `padding` on all sides.
        const bottomPadding =
            descendantsCount > 0
                ? Math.max(styles.padding, styles.expander.height / 2 + styles.expander.spacing)
                : styles.padding;
        const bbox = _ModuleSupport.Group.computeChildrenBBox(rowScenes.flat()).grow({
            top: styles.padding,
            right: styles.padding,
            bottom: bottomPadding,
            left: styles.padding,
        }); // TODO: add stroke width by side

        if (this.shapeNode) {
            this.shapeNode.x = 0;
            this.shapeNode.y = 0;
            this.shapeNode.width = bbox.width;
            this.shapeNode.height = bbox.height;
        }
    }

    updateBBox(bbox: _ModuleSupport.BBox) {
        if (this.shapeNode) {
            this.shapeNode.width = bbox.width;
            this.shapeNode.height = bbox.height;
        }

        if (this.expanderNode) {
            const expanderBBox = this.expanderNode.getBBox();
            this.expanderNode.translationX = bbox.width / 2 - expanderBBox.width / 2;
            this.expanderNode.translationY = bbox.height - expanderBBox.height / 2;
        }
    }

    realign(bbox: _ModuleSupport.BBox) {
        const styles = this.appliedStyles;
        if (!styles) return;

        const { imageNode, titleNode, subtitleNode, labelNodes } = this;

        let imageOffset = 0;

        if (imageNode) {
            if (styles.image.position === 'top' || styles.image.position === 'bottom') {
                imageNode.x = bbox.width / 2 - imageNode.width / 2;
            } else {
                imageOffset = imageNode.width + (styles.image.spacing ?? 0);
            }

            if (styles.image.position === 'right') {
                imageNode.x = bbox.width - imageNode.width - styles.padding;
            }
        }

        const textAreaLeft = styles.image.position === 'left' ? styles.padding + imageOffset : styles.padding;
        const textAreaRight =
            styles.image.position === 'right' ? bbox.width - styles.padding - imageOffset : bbox.width - styles.padding;

        const alignTextNode = (node: _ModuleSupport.Text, textAlign: TextAlign) => {
            switch (textAlign) {
                case 'right':
                    node.x = textAreaRight;
                    break;
                case 'center':
                    node.x = (textAreaLeft + textAreaRight) / 2;
                    break;
                default:
                    node.x = textAreaLeft;
            }
            node.textAlign = textAlign;
        };

        if (titleNode) alignTextNode(titleNode, styles.title.textAlign);
        if (subtitleNode) alignTextNode(subtitleNode, styles.subtitle.textAlign);

        for (const [i, labelStyles] of styles.labels.entries()) {
            const labelNode = labelNodes?.[i];
            if (labelNode) alignTextNode(labelNode, labelStyles.textAlign);
        }
    }

    expanderContainsPoint(point: Point) {
        if (!this.expanderNode) return false;
        return this.expanderNode.containsPoint(point.x, point.y);
    }

    // Card-only bbox in node-local coords; excludes the expander pill that hangs below.
    getCardBBox(): _ModuleSupport.BBox | undefined {
        if (!this.shapeNode) return;
        return new _ModuleSupport.BBox(0, 0, this.shapeNode.width, this.shapeNode.height);
    }

    private updateShapeNode(styles: RequiredOrganizationNodeStyle) {
        this.shapeNode ??= this.appendChild(new _ModuleSupport.Rect());
        this.shapeNode.cornerRadius = styles.cornerRadius;
        applyFillStyles(this.shapeNode, styles);
        applyStrokeStyles(this.shapeNode, styles);
    }

    private updateImageNode(url: string | undefined, styles: RequiredOrganizationNodeStyle) {
        if (url == null || !styles.image.enabled) {
            this.imageNode?.remove();
            this.imageNode = undefined;
            return;
        }

        this.imageNode ??= this.appendChild(new _ModuleSupport.Rect());

        this.imageNode.fill = {
            type: 'image',
            fit: 'cover',
            url: url,
            width: styles.image.width,
            height: styles.image.height,
            backgroundFillOpacity: 0,
        };

        this.imageNode.width = styles.image.width;
        this.imageNode.height = styles.image.height;
        // `'circle'` shape produces a true circle when width === height; if the image
        // dimensions differ it degrades gracefully to a stadium (rounded ends, flat sides),
        // since `Rect.cornerRadius` is a single scalar applied to all four corners.
        this.imageNode.cornerRadius =
            styles.image.shape === 'circle' ? Math.min(styles.image.width, styles.image.height) / 2 : 0;
    }

    private updateTitleNode(text: TextOrSegments | undefined, styles: RequiredOrganizationNodeStyle) {
        if (text == null || !styles.title.enabled) {
            this.titleNode?.remove();
            this.titleNode = undefined;
            return;
        }

        this.titleNode ??= this.appendChild(new _ModuleSupport.Text());
        this.titleNode.text = text;
        applyTextStyles(this.titleNode, { ...styles.title, textAlign: 'left' });
        applyTextBoxingStyles(this.titleNode, styles.title);
    }

    private updateSubtitleNode(text: TextOrSegments | undefined, styles: RequiredOrganizationNodeStyle) {
        if (text == null || !styles.subtitle.enabled) {
            this.subtitleNode?.remove();
            this.subtitleNode = undefined;
            return;
        }

        this.subtitleNode ??= this.appendChild(new _ModuleSupport.Text());
        this.subtitleNode.text = text;
        applyTextStyles(this.subtitleNode, { ...styles.subtitle, textAlign: 'left' });
        applyTextBoxingStyles(this.subtitleNode, styles.subtitle);
    }

    private updateLabelNodes(
        labels: (TextOrSegments | undefined)[] | undefined,
        styles: RequiredOrganizationNodeStyle
    ) {
        if (labels == null) return;

        this.labelNodes ??= [];

        let index = 0;
        for (const labelText of labels) {
            if (labelText == null || !styles.labels[index].enabled) {
                this.labelNodes[index]?.remove();
                this.labelNodes[index] = undefined;
                index++;
                continue;
            }
            this.labelNodes[index] ??= this.appendChild(new _ModuleSupport.Text());
            this.labelNodes[index]!.text = labelText;
            applyTextStyles(this.labelNodes[index]!, { ...styles.labels[index], textAlign: 'left' });
            applyTextBoxingStyles(this.labelNodes[index]!, styles.labels[index]);
            index++;
        }
    }

    private updateExpanderNode(descendantsCount: number, isCollapsed: boolean, styles: RequiredOrganizationNodeStyle) {
        if (descendantsCount === 0) {
            this.expanderNode?.remove();
            this.expanderNode = undefined;
            return;
        }

        this.expanderNode ??= this.appendChild(new OrganizationExpanderNode());
        this.expanderNode.update(descendantsCount, isCollapsed, styles);
    }
}

// Chevron geometry constants (all in px).
const CHEVRON_WIDTH = 8;
const CHEVRON_HEIGHT = 5;
const CHEVRON_GAP = 5; // gap between count text right edge and chevron left edge
// Inset the pill content by the same amount on both sides so the count text and the
// chevron are visually balanced within the pill.
const PILL_HORIZONTAL_PADDING = 12;
// Render the chevron slightly muted versus the count digit so the number reads as the
// primary affordance and the directional cue stays a secondary glyph.
const CHEVRON_OPACITY = 0.7;

class OrganizationExpanderNode extends _ModuleSupport.TranslatableGroup {
    override name = 'organization-node-expander';

    private shapeNode?: _ModuleSupport.Rect;
    private countNode?: _ModuleSupport.Text;
    private chevronNode?: _ModuleSupport.Path;

    update(descendantsCount: number, isCollapsed: boolean, styles: RequiredOrganizationNodeStyle) {
        this.shapeNode ??= this.appendChild(new _ModuleSupport.Rect());

        this.countNode ??= this.appendChild(new _ModuleSupport.Text());
        this.countNode.text = `${descendantsCount}`;
        this.countNode.textAlign = 'left';
        applyTextStyles(this.countNode, styles.subtitle);
        this.countNode.x = PILL_HORIZONTAL_PADDING;

        const rawBBox = this.countNode.getBBox();
        // Render the pill at exactly `expander.height` so the layout reservation in
        // `networkTreeLayout` matches the rendered pill — diverging here would let link
        // elbows or child rows overlap the expander when `height` is under-specified.
        // The public type contract documents that `height` must accommodate the count text.
        const pillHeight = styles.expander.height;
        this.countNode.y = (pillHeight - rawBBox.height) / 2;

        const chevronLeft = this.countNode.x + rawBBox.width + CHEVRON_GAP;
        const chevronMidY = pillHeight / 2;

        this.chevronNode ??= this.appendChild(new _ModuleSupport.Path());
        this.updateChevron(this.chevronNode, chevronLeft, chevronMidY, isCollapsed);

        // Pill width: leading padding + count text + gap + chevron + trailing padding.
        const pillContentWidth = chevronLeft + CHEVRON_WIDTH + PILL_HORIZONTAL_PADDING;
        this.shapeNode.x = 0;
        this.shapeNode.y = 0;
        this.shapeNode.width = Math.max(48, pillContentWidth);
        this.shapeNode.height = pillHeight;

        applyFillStyles(this.shapeNode, styles);
        applyStrokeStyles(this.shapeNode, styles);
        this.shapeNode.cornerRadius = styles.cornerRadius;
    }

    private updateChevron(path: _ModuleSupport.Path, left: number, midY: number, isCollapsed: boolean) {
        // Point-down chevron (expanded state) — apex at bottom centre, base at top.
        // Flip vertically for collapsed state (point up, apex at top centre).
        const halfW = CHEVRON_WIDTH / 2;
        const halfH = CHEVRON_HEIGHT / 2;

        const apexY = isCollapsed ? midY - halfH : midY + halfH;
        const baseY = isCollapsed ? midY + halfH : midY - halfH;

        path.path.clear();
        path.path.moveTo(left, baseY);
        path.path.lineTo(left + CHEVRON_WIDTH, baseY);
        path.path.lineTo(left + halfW, apexY);
        path.path.closePath();

        // Match the count digit's colour so the chevron and number read as a single
        // affordance inside the pill. countNode.fill is set immediately before this
        // is called via `applyTextStyles`; it is always a string at runtime.
        const countFill = this.countNode?.fill;
        path.fill = typeof countFill === 'string' ? countFill : '#000';
        path.stroke = 'none';
        path.opacity = CHEVRON_OPACITY;
    }

    // override containsPoint(x: number, y: number) {
    //     return this.shapeNode?.containsPoint(x, y) ?? false;
    // }
}
