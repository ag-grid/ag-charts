import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { Image } = _Scene;
const { BaseProperties, ObserveChanges, ProxyProperty, Validate, NUMBER, POSITIVE_NUMBER, RATIO } = _ModuleSupport;

export class BackgroundImage extends BaseProperties {
    private readonly imageElement: HTMLImageElement;
    private loadedSynchronously: boolean = true;
    readonly node: _Scene.Image;

    constructor(ctx: Pick<_ModuleSupport.ModuleContext, 'document'>) {
        super();

        this.imageElement = ctx.document.createElement('img');
        this.imageElement.onload = this.onImageLoad;
        this.node = new Image(this.imageElement);
    }

    @Validate(NUMBER, { optional: true })
    top?: number;

    @Validate(NUMBER, { optional: true })
    right?: number;

    @Validate(NUMBER, { optional: true })
    bottom?: number;

    @Validate(NUMBER, { optional: true })
    left?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    width?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    height?: number;

    @Validate(RATIO)
    opacity: number = 1;

    @ProxyProperty('imageElement.src')
    @ObserveChanges<BackgroundImage>((target) => (target.loadedSynchronously = target.complete))
    url?: string;

    get complete() {
        // In tests image is nodejs-canvas Image, which doesn't report its status in the 'complete' method correctly.
        return this.imageElement.width > 0 && this.imageElement.height > 0;
    }

    private containerWidth: number = 0;
    private containerHeight: number = 0;
    onLoad?: () => void = undefined;

    performLayout(containerWidth: number, containerHeight: number) {
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        this.node.setProperties(
            this.complete
                ? {
                      visible: true,
                      opacity: this.opacity,
                      ...this.calculatePosition(this.imageElement.width, this.imageElement.height),
                  }
                : { visible: false }
        );
    }

    calculatePosition(naturalWidth: number, naturalHeight: number) {
        let { top, right, bottom, left, width, height } = this;

        if (left != null) {
            if (width != null) {
                right = this.containerWidth - left + width;
            } else if (right != null) {
                width = this.containerWidth - left - right;
            }
        } else if (right != null && width != null) {
            left = this.containerWidth - right - width;
        }
        if (top != null) {
            if (height != null) {
                bottom = this.containerHeight - top - height;
            } else if (bottom != null) {
                height = this.containerHeight - bottom - top;
            }
        } else if (bottom != null && height != null) {
            top = this.containerHeight - bottom - height;
        }

        // If width and height still undetermined, derive them from natural size.
        if (width == null) {
            if (height == null) {
                width = naturalWidth;
                height = naturalHeight;
            } else {
                width = Math.ceil((naturalWidth * height) / naturalHeight);
            }
        } else if (height == null) {
            height = Math.ceil((naturalHeight * width) / naturalWidth);
        }

        if (left == null) {
            if (right == null) {
                left = Math.floor((this.containerWidth - width) / 2);
            } else {
                left = this.containerWidth - right - width;
            }
        }
        if (top == null) {
            if (bottom == null) {
                top = Math.floor((this.containerHeight - height) / 2);
            } else {
                top = this.containerHeight - height - bottom;
            }
        }

        return { x: left, y: top, width, height };
    }

    private onImageLoad = () => {
        if (this.loadedSynchronously) {
            return;
        }

        this.node.visible = false; // Ensure marked dirty.
        this.performLayout(this.containerWidth, this.containerHeight);

        this.onLoad?.();
    };
}
