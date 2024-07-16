"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardown = exports.setup = exports.MockContext = void 0;
const canvas_1 = require("canvas");
const mock_canvas_text_1 = require("./mock-canvas-text");
class MockContext {
    constructor(width = 1, height = 1, document, realCreateElement = document.createElement) {
        this.canvases = [];
        this.document = document;
        const nodeCanvas = (0, canvas_1.createCanvas)(width, height);
        this.realCreateElement = realCreateElement;
        this.ctx = {
            nodeCanvas,
            getActiveCanvasInstances: this.getActiveCanvasInstances.bind(this),
        };
        this.canvasStack = [nodeCanvas];
        this.registerCanvasInstance(nodeCanvas);
    }
    registerCanvasInstance(canvas) {
        this.canvases.push(new WeakRef(canvas));
    }
    getActiveCanvasInstances() {
        const instances = this.canvases.map((ref) => ref.deref());
        this.canvases = this.canvases.filter((ref, index) => instances[index] != null);
        return instances.filter((value) => value != null);
    }
    destroy() {
        this.ctx.nodeCanvas = undefined;
        this.realCreateElement = undefined;
        this.canvasStack = [];
        this.canvases = [];
    }
}
exports.MockContext = MockContext;
function setup(opts) {
    const { width = 800, height = 600, document = window.document, mockCtx = new MockContext(width, height, document), mockText = false, } = opts;
    if (mockText) {
        (0, mock_canvas_text_1.mockCanvasText)();
    }
    const nodeCanvas = (0, canvas_1.createCanvas)(width, height);
    mockCtx.ctx.nodeCanvas = nodeCanvas;
    mockCtx.canvasStack = [nodeCanvas];
    if (typeof window !== 'undefined') {
        window['agChartsSceneRenderModel'] = 'composite';
    }
    else {
        global['agChartsSceneRenderModel'] = 'composite';
    }
    const realCreateElement = document.createElement;
    mockCtx.realCreateElement = realCreateElement;
    document.createElement = (element, options) => {
        if (element === 'canvas') {
            const mockedElement = realCreateElement.call(document, element, options);
            let [nextCanvas] = mockCtx.canvasStack.splice(0, 1);
            if (!nextCanvas) {
                nextCanvas = (0, canvas_1.createCanvas)(width, height);
            }
            mockCtx.registerCanvasInstance(nextCanvas);
            mockedElement.getContext = (type) => {
                const context2d = nextCanvas.getContext(type, { alpha: true });
                context2d.patternQuality = 'good';
                context2d.quality = 'good';
                context2d.textDrawingMode = 'path';
                context2d.antialias = 'subpixel';
                return context2d;
            };
            return mockedElement;
        }
        else if (element === 'img') {
            return new canvas_1.Image();
        }
        return realCreateElement.call(document, element, options);
    };
    return mockCtx;
}
exports.setup = setup;
function teardown(mockContext) {
    mockContext.document.createElement = mockContext.realCreateElement;
    mockContext.destroy();
}
exports.teardown = teardown;
//# sourceMappingURL=mock-canvas.js.map