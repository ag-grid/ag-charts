import { type TextAlign, type TextOrSegments, _ModuleSupport } from 'ag-charts-community';
import type { Point } from 'ag-charts-core';

import { layoutScenesColumn, layoutScenesRow } from '../../utils/sceneLayout';
import type { OrganizationDatum, RequiredOrganizationNodeStyle } from './organizationTypes';
import { applyFillStyles, applyStrokeStyles, applyTextStyles } from './organizationUtils';

export class OrganizationNode extends _ModuleSupport.TranslatableGroup<OrganizationDatum> {
    private shapeNode?: _ModuleSupport.Rect;
    private imageNode?: _ModuleSupport.Rect;
    private titleNode?: _ModuleSupport.Text;
    private subtitleNode?: _ModuleSupport.Text;
    private labelNodes?: (_ModuleSupport.Text | undefined)[];

    private expanderNode?: OrganizationExpanderNode;

    update(datum: OrganizationDatum['datum'], descendantsCount: number, styles: RequiredOrganizationNodeStyle) {
        this.updateShapeNode(styles);
        this.updateImageNode(datum.image, styles);
        this.updateTitleNode(datum.title, styles);
        this.updateSubtitleNode(datum.subtitle, styles);
        this.updateLabelNodes(datum.labels, styles);
        this.updateExpanderNode(descendantsCount, styles);

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

        const bbox = _ModuleSupport.Group.computeChildrenBBox(rowScenes.flat()).grow(styles.padding); // TODO: add stroke width by side

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

    realign(
        styles: {
            image: {
                position: 'top' | 'right' | 'bottom' | 'left';
                spacing: number;
            };
            padding: number;
            title: { textAlign: TextAlign };
            subtitle: { textAlign: TextAlign };
            labels: { textAlign: TextAlign }[];
        },
        bbox: _ModuleSupport.BBox
    ) {
        const { imageNode, titleNode, subtitleNode, labelNodes } = this;

        let imageOffset = 0;
        const imageSide = styles.image.position === 'left' ? 1 : -1;

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

        if (titleNode) {
            if (styles.title.textAlign === 'right') {
                titleNode.x += bbox.width - styles.padding * 2 - imageOffset;
            } else if (styles.title.textAlign === 'center') {
                titleNode.x = bbox.width / 2 + (imageOffset * imageSide) / 2;
            }
            titleNode.textAlign = styles.title.textAlign;
        }

        if (subtitleNode) {
            if (styles.subtitle.textAlign === 'right') {
                subtitleNode.x += bbox.width - styles.padding * 2 - imageOffset;
            } else if (styles.subtitle.textAlign === 'center') {
                subtitleNode.x = bbox.width / 2 + (imageOffset * imageSide) / 2;
            }
            subtitleNode.textAlign = styles.subtitle.textAlign;
        }

        let index = 0;
        for (const labelStyles of styles.labels) {
            const labelNode = labelNodes?.[index];
            if (labelNode) {
                if (labelStyles.textAlign === 'right') {
                    labelNode.x += bbox.width - styles.padding * 2 - imageOffset;
                } else if (labelStyles.textAlign === 'center') {
                    labelNode.x = bbox.width / 2 + (imageOffset * imageSide) / 2;
                }
                labelNode.textAlign = labelStyles.textAlign;
            }
            index++;
        }
    }

    expanderContainsPoint(point: Point) {
        if (!this.expanderNode) return false;
        return this.expanderNode.containsPoint(point.x, point.y);
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
            index++;
        }
    }

    private updateExpanderNode(descendantsCount: number, styles: RequiredOrganizationNodeStyle) {
        if (descendantsCount === 0) {
            this.expanderNode?.remove();
            this.expanderNode = undefined;
            return;
        }

        this.expanderNode ??= this.appendChild(new OrganizationExpanderNode());
        this.expanderNode.update(descendantsCount, styles);
    }
}

class OrganizationExpanderNode extends _ModuleSupport.TranslatableGroup {
    override name = 'organization-node-expander';

    private shapeNode?: _ModuleSupport.Rect;
    private countNode?: _ModuleSupport.Text;

    update(descendantsCount: number, styles: RequiredOrganizationNodeStyle) {
        this.shapeNode ??= this.appendChild(new _ModuleSupport.Rect());

        this.countNode ??= this.appendChild(new _ModuleSupport.Text());
        this.countNode.text = `${descendantsCount}`;
        this.countNode.textAlign = 'left';
        applyTextStyles(this.countNode, styles.subtitle);
        this.countNode.x = 12;
        this.countNode.y = 4;

        const bbox = this.countNode.getBBox().clone().grow({ top: 4, right: 8, bottom: 4, left: 8 });

        this.shapeNode.x = 0;
        this.shapeNode.y = 0;
        this.shapeNode.width = Math.max(48, bbox.width);
        this.shapeNode.height = Math.max(24, bbox.height);

        applyFillStyles(this.shapeNode, styles);
        applyStrokeStyles(this.shapeNode, styles);
        this.shapeNode.cornerRadius = styles.cornerRadius;
    }

    // override containsPoint(x: number, y: number) {
    //     return this.shapeNode?.containsPoint(x, y) ?? false;
    // }
}
