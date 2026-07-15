import { type TextAlign, _ModuleSupport } from 'ag-charts-community';
import { type NormalisedTextOrSegments, wrapTextOrSegments } from 'ag-charts-core';

import { layoutScenesColumn, layoutScenesRow } from '../../utils/sceneLayout';
import type {
    NormalisedOrganizationNodeStyle,
    NormalisedOrganizationNodeTextStyle,
    OrganizationDatum,
    OrganizationNodeFields,
} from './organizationTypes';
import { applyFillStyles, applyStrokeStyles, applyTextBoxingStyles, applyTextStyles } from './organizationUtils';

// Scene-node `tag` selector so hit-testing can tell the card apart from the expander control.
export enum OrganizationNodeTag {
    Card,
    Expander,
}

// Sub-pixel slack on the overflow check; pure float-comparison guard, not user-tunable.
const CLIP_EPSILON = 0.5;

function computeTextMaxWidth(styles: NormalisedOrganizationNodeStyle): number {
    const cardWidth = Number.isNaN(styles.width) ? styles.maxWidth : styles.width;
    if (!Number.isFinite(cardWidth)) return Infinity;

    const imageHorizontalSpace =
        styles.image.enabled && (styles.image.position === 'left' || styles.image.position === 'right')
            ? styles.image.width + styles.image.spacing
            : 0;

    return cardWidth - 2 * (styles.padding.left + styles.padding.right) - imageHorizontalSpace;
}

function wrapTextTier(
    text: NormalisedTextOrSegments,
    tierStyles: NormalisedOrganizationNodeTextStyle,
    maxWidth: number
): NormalisedTextOrSegments {
    const tierWidth = Math.max(maxWidth - (tierStyles.padding.left + tierStyles.padding.right), 1);
    if (!Number.isFinite(tierWidth)) return text;

    return wrapTextOrSegments(text, {
        font: tierStyles,
        maxWidth: tierWidth,
        textWrap: tierStyles.wrapping,
        overflow: tierStyles.overflowStrategy,
    });
}

export class OrganizationNode extends _ModuleSupport.TranslatableGroup<OrganizationDatum> {
    // Field initialisation order is the scene-graph z-order: card border (`shapeNode`) at
    // the bottom, image + text tiers in `contentGroup` above it, and the expander pill is
    // appended later in `updateExpanderNode` so it stays visually on top. `contentGroup`
    // also carries the conditional clip applied in `updateBBox` when `maxWidth`/`maxHeight`
    // clamp the card under its intrinsic content size.
    private readonly shapeNode = this.appendChild(new _ModuleSupport.Rect({ tag: OrganizationNodeTag.Card }));
    private readonly contentGroup = this.appendChild(new _ModuleSupport.Group());
    private imageNode?: _ModuleSupport.Rect;
    private titleNode?: _ModuleSupport.Text;
    private subtitleNode?: _ModuleSupport.Text;
    private labelNodes?: (_ModuleSupport.Text | undefined)[];

    private expanderNode?: OrganizationExpanderNode;

    private appliedStyles?: NormalisedOrganizationNodeStyle;
    private intrinsicCardSize?: { width: number; height: number };

    update(
        fields: OrganizationNodeFields,
        expanderText: NormalisedTextOrSegments,
        descendentsCount: number,
        styles: NormalisedOrganizationNodeStyle,
        isCollapsed: boolean,
        isRtl: boolean
    ) {
        this.appliedStyles = styles;
        const textMaxWidth = computeTextMaxWidth(styles);
        this.updateShapeNode(styles);
        this.updateImageNode(fields.image, styles);
        this.updateTitleNode(fields.title, styles, textMaxWidth);
        this.updateSubtitleNode(fields.subtitle, styles, textMaxWidth);
        this.updateLabelNodes(fields.labels, styles, textMaxWidth);
        this.updateExpanderNode(expanderText, descendentsCount, isCollapsed, isRtl, styles);

        let rowScenes = [];
        let rowGaps: number[] = [];

        const columnScenes = [];
        const columnGaps: number[] = [];

        if (this.imageNode && styles.image.position === 'top') {
            this.imageNode.x = styles.padding.left;
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
            this.imageNode.x = styles.padding.left;
            columnScenes.push(this.imageNode);
            columnGaps.push(styles.image.spacing);
        }

        if (this.imageNode && styles.image.position === 'left') {
            this.imageNode.y = styles.padding.top;
            rowScenes = [this.imageNode, columnScenes];
            rowGaps = [styles.image.spacing];
        } else if (this.imageNode && styles.image.position === 'right') {
            this.imageNode.y = styles.padding.top;
            rowScenes = [columnScenes, this.imageNode];
            rowGaps = [styles.image.spacing];
        } else {
            rowScenes = [columnScenes];
        }

        layoutScenesColumn(columnScenes, styles.padding.top, columnGaps);
        layoutScenesRow(rowScenes, styles.padding.left, rowGaps);

        let lastElementSpacing = this.subtitleNode ? styles.subtitle.spacing : styles.title.spacing;
        if (this.imageNode && styles.image.position === 'bottom') {
            lastElementSpacing = styles.image.spacing;
        } else if (this.labelNodes && this.labelNodes.length > 0) {
            lastElementSpacing = styles.labels.at(-1)?.spacing ?? lastElementSpacing;
        }

        const bottomPadding = this.expanderNode
            ? Math.max(styles.padding.bottom, this.expanderNode.getBBox().height / 2 + lastElementSpacing)
            : styles.padding.bottom;

        const bbox = _ModuleSupport.Group.computeChildrenBBox(rowScenes.flat()).grow({
            ...styles.padding,
            bottom: bottomPadding,
        }); // TODO: add stroke width by side

        this.shapeNode.x = 0;
        this.shapeNode.y = 0;
        this.shapeNode.width = bbox.width;
        this.shapeNode.height = bbox.height;

        // Capture the intrinsic content size before `updateBBox` clamps the card to
        // `regularBBox`; `updateBBox` consults this to decide whether a clip is needed.
        this.intrinsicCardSize = { width: bbox.width, height: bbox.height };
    }

    updateBBox(bbox: _ModuleSupport.BBox) {
        this.shapeNode.width = bbox.width;
        this.shapeNode.height = bbox.height;

        if (this.expanderNode) {
            const expanderBBox = this.expanderNode.getBBox();
            this.expanderNode.translationX = bbox.width / 2 - expanderBBox.width / 2;
            this.expanderNode.translationY = bbox.height - expanderBBox.height / 2;
        }

        // Conditional clip: only when `regularBBox` clamped the card under its intrinsic
        // size (i.e. `maxWidth`/`maxHeight` kicked in). With no overflow we leave the
        // contentGroup unclipped so the per-frame `ctx.save/clip/restore` cost is zero.
        const intrinsic = this.intrinsicCardSize;
        const overflows =
            intrinsic != null &&
            (intrinsic.width > bbox.width + CLIP_EPSILON || intrinsic.height > bbox.height + CLIP_EPSILON);
        this.contentGroup.setClipRectCanvasSpace(
            overflows ? new _ModuleSupport.BBox(0, 0, bbox.width, bbox.height) : undefined
        );
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
                imageNode.x = bbox.width - imageNode.width - styles.padding.right;
            }
        }

        const textAreaLeft = styles.image.position === 'left' ? styles.padding.left + imageOffset : styles.padding.left;
        const textAreaRight =
            styles.image.position === 'right'
                ? bbox.width - styles.padding.right - imageOffset
                : bbox.width - styles.padding.right;

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

    // Card-only bbox in node-local coords; excludes the expander pill that hangs below.
    getCardBBox(): _ModuleSupport.BBox {
        return new _ModuleSupport.BBox(0, 0, this.shapeNode.width, this.shapeNode.height);
    }

    // Card + expander pill in node-local coords; used by the keyboard focus ring.
    getFocusBBox(): _ModuleSupport.BBox {
        const cardBBox = this.getCardBBox();
        if (!this.expanderNode) return cardBBox;
        // expanderNode.getBBox() is already in OrganizationNode-local coords (TranslatableGroup).
        return _ModuleSupport.BBox.merge([cardBBox, this.expanderNode.getBBox()]);
    }

    private updateShapeNode(styles: NormalisedOrganizationNodeStyle) {
        this.shapeNode.cornerRadius = styles.cornerRadius;
        applyFillStyles(this.shapeNode, styles);
        applyStrokeStyles(this.shapeNode, styles);
    }

    private updateImageNode(url: string | undefined, styles: NormalisedOrganizationNodeStyle) {
        if (url == null || !styles.image.enabled) {
            this.imageNode?.remove();
            this.imageNode = undefined;
            return;
        }

        this.imageNode ??= this.contentGroup.appendChild(new _ModuleSupport.Rect());

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
        this.imageNode.cornerRadius = Math.min(
            styles.image.cornerRadius,
            styles.image.width / 2,
            styles.image.height / 2
        );
    }

    private updateTitleNode(
        text: NormalisedTextOrSegments | undefined,
        styles: NormalisedOrganizationNodeStyle,
        textMaxWidth: number
    ) {
        if (text == null || !styles.title.enabled) {
            this.titleNode?.remove();
            this.titleNode = undefined;
            return;
        }

        this.titleNode ??= this.contentGroup.appendChild(new _ModuleSupport.Text());
        this.titleNode.text = wrapTextTier(text, styles.title, textMaxWidth);
        applyTextStyles(this.titleNode, { ...styles.title, textAlign: 'left' });
        applyTextBoxingStyles(this.titleNode, styles.title);
    }

    private updateSubtitleNode(
        text: NormalisedTextOrSegments | undefined,
        styles: NormalisedOrganizationNodeStyle,
        textMaxWidth: number
    ) {
        if (text == null || !styles.subtitle.enabled) {
            this.subtitleNode?.remove();
            this.subtitleNode = undefined;
            return;
        }

        this.subtitleNode ??= this.contentGroup.appendChild(new _ModuleSupport.Text());
        this.subtitleNode.text = wrapTextTier(text, styles.subtitle, textMaxWidth);
        applyTextStyles(this.subtitleNode, { ...styles.subtitle, textAlign: 'left' });
        applyTextBoxingStyles(this.subtitleNode, styles.subtitle);
    }

    private updateLabelNodes(
        labels: (NormalisedTextOrSegments | undefined)[] | undefined,
        styles: NormalisedOrganizationNodeStyle,
        textMaxWidth: number
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
            this.labelNodes[index] ??= this.contentGroup.appendChild(new _ModuleSupport.Text());
            this.labelNodes[index]!.text = wrapTextTier(labelText, styles.labels[index], textMaxWidth);
            applyTextStyles(this.labelNodes[index]!, { ...styles.labels[index], textAlign: 'left' });
            applyTextBoxingStyles(this.labelNodes[index]!, styles.labels[index]);
            index++;
        }

        // Trim trailing nodes so labels from a previously-bound datum don't leak after reuse.
        for (let i = labels.length; i < this.labelNodes.length; i++) {
            this.labelNodes[i]?.remove();
        }
        this.labelNodes.length = labels.length;
    }

    private updateExpanderNode(
        expanderText: NormalisedTextOrSegments,
        descendantsCount: number,
        isCollapsed: boolean,
        isRtl: boolean,
        styles: NormalisedOrganizationNodeStyle
    ) {
        if (descendantsCount === 0 || !styles.expander.enabled) {
            this.expanderNode?.remove();
            this.expanderNode = undefined;
            return;
        }

        this.expanderNode ??= this.appendChild(new OrganizationExpanderNode());
        this.expanderNode.update(expanderText, isCollapsed, isRtl, styles);
    }
}

class OrganizationExpanderNode extends _ModuleSupport.TranslatableGroup {
    override name = 'organization-node-expander';

    private shapeNode?: _ModuleSupport.Rect;
    private countNode?: _ModuleSupport.Text;
    private chevronNode?: ChevronPath;

    update(
        expanderText: NormalisedTextOrSegments,
        isCollapsed: boolean,
        isRtl: boolean,
        styles: NormalisedOrganizationNodeStyle
    ) {
        this.shapeNode ??= this.appendChild(new _ModuleSupport.Rect({ tag: OrganizationNodeTag.Expander }));

        this.countNode ??= this.appendChild(new _ModuleSupport.Text({ tag: OrganizationNodeTag.Expander }));
        this.countNode.y = styles.expander.padding.top;

        this.countNode.text = expanderText;
        applyTextStyles(this.countNode, styles.expander.text);

        this.chevronNode ??= this.appendChild(new ChevronPath({ tag: OrganizationNodeTag.Expander }));
        this.chevronNode.update(
            styles.expander.text.fontSize * (7 / 12),
            styles.expander.text.fontSize * (3.5 / 12),
            isCollapsed,
            styles
        );
        this.chevronNode.translationY = styles.expander.padding.top + styles.expander.text.fontSize / 2;

        layoutScenesRow(
            isRtl ? [this.chevronNode, this.countNode] : [this.countNode, this.chevronNode],
            styles.expander.padding.left,
            [styles.expander.text.fontSize]
        );

        const bbox = _ModuleSupport.Group.computeChildrenBBox([this.countNode, this.chevronNode]).grow(
            styles.expander.padding
        );

        this.shapeNode.x = 0;
        this.shapeNode.y = 0;
        this.shapeNode.width = bbox.width;
        this.shapeNode.height = bbox.height;

        applyFillStyles(this.shapeNode, styles.expander);
        applyStrokeStyles(this.shapeNode, styles.expander);
        this.shapeNode.cornerRadius = styles.expander.cornerRadius;
    }
}

class ChevronPath extends _ModuleSupport.Rotatable(_ModuleSupport.Translatable(_ModuleSupport.Path)) {
    update(width: number, height: number, isCollapsed: boolean, styles: NormalisedOrganizationNodeStyle) {
        const { path } = this;

        path.clear();
        path.moveTo(0, 0);
        path.lineTo(width / 2, height);
        path.lineTo(width, 0);

        this.translationY = styles.expander.padding.top;
        this.rotationCenterX = width / 2;
        this.rotationCenterY = height / 2;
        this.rotation = isCollapsed ? 0 : Math.PI;
        this.stroke = styles.expander.text.color;
        this.strokeWidth = 1;
        this.fill = 'transparent';
    }
}
