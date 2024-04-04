import { createDiv, createElement, getWindow } from '../../util/dom';
import { hasConstrainedCanvasMemory } from '../../util/userAgent';
import { EventEmitter } from '../util/eventEmitter';
import type { IScene, SceneEventMap } from './types';

export class Scene implements IScene {
    static ElementClassName = 'ag-chart-wrapper';
    static ElementStyle = { position: 'relative', userSelect: 'none' };

    readonly events = new EventEmitter<SceneEventMap>();

    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly rootElement: HTMLDivElement;
    readonly rootNode: object;

    constructor(
        public width: number,
        public height: number,
        public pixelRatio: number = getWindow('devicePixelRatio')
    ) {
        if (hasConstrainedCanvasMemory()) {
            this.pixelRatio = 1;
        }

        // Create canvas and immediately apply width + height to avoid out-of-memory errors on iOS/iPadOS Safari.
        this.canvas = createElement('canvas');
        this.setCanvasSize(width, height);

        this.context = this.canvas.getContext('2d')!;
        this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

        this.rootElement = createDiv(Scene.ElementStyle, Scene.ElementClassName);
        this.rootElement.appendChild(this.canvas);

        this.rootNode = {};
    }

    clear() {
        this.context.save();
        this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.restore();
    }

    update() {}

    resize(width: number, height: number) {
        if (width === this.width && height === this.height) return;

        this.setCanvasSize(width, height);

        this.width = width;
        this.height = height;

        this.events.emit('resize', { width, height });
    }

    toDataURL(type?: string): string {
        return this.canvas.toDataURL(type);
    }

    remove() {
        this.canvas.remove();

        // Workaround memory allocation quirks in iOS Safari by resizing to 0x0 and clearing.
        // See https://bugs.webkit.org/show_bug.cgi?id=195325.
        this.canvas.width = 0;
        this.canvas.height = 0;
        this.context.clearRect(0, 0, 0, 0);

        Object.freeze(this);
    }

    private setCanvasSize(width: number, height: number) {
        const { canvas, pixelRatio } = this;

        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);

        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }
}
