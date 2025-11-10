import { _ModuleSupport } from 'ag-charts-community';
import {
    BaseProperties,
    ObserveChanges,
    type Placement,
    Property,
    ProxyProperty,
    calculatePlacement,
    createElement,
} from 'ag-charts-core';

export class Image extends BaseProperties {
    @Property
    top?: number;

    @Property
    right?: number;

    @Property
    bottom?: number;

    @Property
    left?: number;

    @Property
    width?: number;

    @Property
    height?: number;

    @Property
    opacity: number = 1;

    @ProxyProperty('imageElement.src')
    @ObserveChanges<Image>((target) => (target.loadedSynchronously = target.complete))
    url?: string;

    private readonly imageElement: HTMLImageElement;
    private loadedSynchronously: boolean = true;
    readonly node: _ModuleSupport.Image;

    constructor() {
        super();

        this.imageElement = createElement('img');
        this.imageElement.onload = this.onImageLoad;
        this.node = new _ModuleSupport.Image(this.imageElement);
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
        const placement = calculatePlacement(this.imageElement.width, this.imageElement.height, container, this);
        this.node.setProperties(
            this.complete
                ? {
                      visible: true,
                      opacity: this.opacity,
                      ...placement,
                  }
                : { visible: false }
        );

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
