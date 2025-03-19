import { _ModuleSupport } from 'ag-charts-community';
import { createElement } from 'ag-charts-core';

const {
    BaseProperties,
    ObserveChanges,
    ProxyProperty,
    TempValidate,
    NUMBER,
    POSITIVE_NUMBER,
    RATIO,
    calculatePlacement,
} = _ModuleSupport;

export class Image extends BaseProperties {
    @TempValidate(NUMBER, { optional: true })
    top?: number;

    @TempValidate(NUMBER, { optional: true })
    right?: number;

    @TempValidate(NUMBER, { optional: true })
    bottom?: number;

    @TempValidate(NUMBER, { optional: true })
    left?: number;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    width?: number;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    height?: number;

    @TempValidate(RATIO)
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

    performLayout(containerWidth: number, containerHeight: number): _ModuleSupport.Placement {
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
