import { type TextOrSegments, _ModuleSupport } from 'ag-charts-community';

import { layoutScenesColumn, layoutScenesRow } from '../../utils/sceneLayout';
import type { OrganizationDatum, RequiredOrganizationNodeStyle } from './organizationTypes';
import { applyFillStyles, applyStrokeStyles, applyTextStyles } from './organizationUtils';

export class OrganizationNode extends _ModuleSupport.TranslatableGroup<OrganizationDatum> {
    private shapeNode?: _ModuleSupport.Rect;
    private imageNode?: _ModuleSupport.Rect;
    private titleNode?: _ModuleSupport.Text;
    private subtitleNode?: _ModuleSupport.Text;
    private labelNodes?: (_ModuleSupport.Text | undefined)[];

    private readonly padding = 20;

    update(datum: OrganizationDatum['datum'], styles: RequiredOrganizationNodeStyle) {
        this.updateShapeNode(styles);
        this.updateImageNode(datum.image, styles);
        this.updateTitleNode(datum.title, styles);
        this.updateSubtitleNode(datum.subtitle, styles);
        this.updateLabelNodes(datum.labels, styles);

        let rowScenes = [];
        let rowGaps: number[] = [];

        const columnScenes = [];
        const columnGaps: number[] = [];

        if (this.imageNode && styles.image.position === 'top') {
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
            columnScenes.push(this.imageNode);
            columnGaps.push(styles.image.spacing);
        }

        if (this.imageNode && styles.image.position === 'left') {
            this.imageNode.y = this.padding;
            rowScenes = [this.imageNode, columnScenes];
            rowGaps = [styles.image.spacing];
        } else if (this.imageNode && styles.image.position === 'right') {
            this.imageNode.y = this.padding;
            rowScenes = [columnScenes, this.imageNode];
            rowGaps = [styles.image.spacing];
        } else {
            rowScenes = [columnScenes];
        }

        layoutScenesColumn(columnScenes, this.padding, columnGaps);
        layoutScenesRow(rowScenes, this.padding, rowGaps);

        const bbox = _ModuleSupport.Group.computeChildrenBBox(rowScenes.flat()).grow(this.padding); // TODO: add stroke width by side

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
    }

    private updateShapeNode(styles: RequiredOrganizationNodeStyle) {
        this.shapeNode ??= this.appendChild(new _ModuleSupport.Rect());
        this.shapeNode.cornerRadius = styles.cornerRadius;
        applyFillStyles(this.shapeNode, styles);
        applyStrokeStyles(this.shapeNode, styles);
    }

    private updateImageNode(url: string | undefined, styles: RequiredOrganizationNodeStyle) {
        if (url == null) {
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
        if (text == null) {
            this.titleNode?.remove();
            this.titleNode = undefined;
            return;
        }

        this.titleNode ??= this.appendChild(new _ModuleSupport.Text());
        this.titleNode.text = text;
        applyTextStyles(this.titleNode, styles.title);
    }

    private updateSubtitleNode(text: TextOrSegments | undefined, styles: RequiredOrganizationNodeStyle) {
        if (text == null) {
            this.subtitleNode?.remove();
            this.subtitleNode = undefined;
            return;
        }

        this.subtitleNode ??= this.appendChild(new _ModuleSupport.Text());
        this.subtitleNode.text = text;
        applyTextStyles(this.subtitleNode, styles.subtitle);
    }

    private updateLabelNodes(
        labels: (TextOrSegments | undefined)[] | undefined,
        styles: RequiredOrganizationNodeStyle
    ) {
        if (labels == null) return;

        this.labelNodes ??= [];

        let index = 0;
        for (const labelText of labels) {
            if (labelText == null) {
                this.labelNodes[index]?.remove();
                this.labelNodes[index] = undefined;
                index++;
                continue;
            }
            this.labelNodes[index] ??= this.appendChild(new _ModuleSupport.Text());
            this.labelNodes[index]!.text = labelText;
            applyTextStyles(this.labelNodes[index]!, styles.labels[index]);
            index++;
        }
    }
}
