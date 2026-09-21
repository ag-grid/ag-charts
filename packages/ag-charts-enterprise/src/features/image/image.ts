import { _ModuleSupport } from 'ag-charts-community';
import { type Placement, calculatePlacement, createElement } from 'ag-charts-core';
import type { AgChartBackground } from 'ag-charts-types';

type ImageOptions = NonNullable<AgChartBackground['image']>;

export class Image {
    private options: ImageOptions | undefined;

    private readonly imageElement: HTMLImageElement;
    private loadedSynchronously: boolean = true;
    readonly node: _ModuleSupport.Image;

    constructor() {
        this.imageElement = createElement('img');
        this.imageElement.onload = this.onImageLoad;
        this.node = new _ModuleSupport.Image(this.imageElement);
    }

    applyOptions(options: ImageOptions) {
        const urlChanged = this.options?.url !== options.url;
        this.options = options;
        if (urlChanged) {
            this.imageElement.src = options.url;
            this.loadedSynchronously = this.complete;
        }
    }

    get complete() {
        // In tests image is nodejs-canvas Image, which doesn't report its status in the 'complete' method correctly.
        return this.imageElement.width > 0 && this.imageElement.height > 0;
    }

    private containerWidth: number = 0;
    private containerHeight: number = 0;
    onLoad?: () => void = undefined;

    performLayout(containerWidth: number, containerHeight: number): Placement {
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        const container = { width: containerWidth, height: containerHeight };
        const { opacity = 1, ...bounds } = this.options ?? {};
        const placement = calculatePlacement(this.imageElement.width, this.imageElement.height, container, bounds);
        this.node.setProperties(this.complete ? { visible: true, opacity, ...placement } : { visible: false });

        return placement;
    }

    private readonly onImageLoad = () => {
        if (this.loadedSynchronously) {
            return;
        }

        this.node.visible = false; // Ensure marked dirty.
        this.performLayout(this.containerWidth, this.containerHeight);

        this.onLoad?.();
    };
}
