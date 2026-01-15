import { createIsolatedEnvironment } from './environment';
import type { IsolatedEnvironment } from './types';

describe('createIsolatedEnvironment', () => {
    let env: IsolatedEnvironment | undefined;

    afterEach(() => {
        env?.dispose();
        env = undefined;
    });

    it('should create an isolated environment with window and document', () => {
        env = createIsolatedEnvironment();

        expect(env.window).toBeDefined();
        expect(env.document).toBeDefined();
        expect(typeof env.dispose).toBe('function');
    });

    it('should provide a container element', () => {
        env = createIsolatedEnvironment();

        const container = env.document.getElementById('container');
        expect(container).toBeDefined();
        expect(container?.tagName.toLowerCase()).toBe('div');
    });

    it('should polyfill requestAnimationFrame', () => {
        env = createIsolatedEnvironment();

        expect(typeof env.window.requestAnimationFrame).toBe('function');
        expect(typeof env.window.cancelAnimationFrame).toBe('function');
    });

    it('should provide working OffscreenCanvas', () => {
        env = createIsolatedEnvironment();

        const OffscreenCanvasCtor = env.window.OffscreenCanvas;
        expect(OffscreenCanvasCtor).toBeDefined();

        // Verify it's the real implementation (not a strict proxy) by instantiating
        const canvas = new OffscreenCanvasCtor(100, 100);
        expect(canvas.width).toBe(100);
        expect(canvas.height).toBe(100);
    });

    it('should provide working DOMMatrix', () => {
        env = createIsolatedEnvironment();

        const DOMMatrixCtor = env.window.DOMMatrix;
        expect(DOMMatrixCtor).toBeDefined();

        // Verify it's the real implementation by instantiating and checking values
        const matrix = new DOMMatrixCtor([1, 0, 0, 1, 10, 20]);
        expect(matrix.e).toBe(10);
        expect(matrix.f).toBe(20);
    });

    it('should provide working Image', () => {
        env = createIsolatedEnvironment();

        const ImageCtor = env.window.Image;
        expect(ImageCtor).toBeDefined();

        // Verify it's the real implementation by instantiating
        const img = new ImageCtor();
        expect(img).toBeDefined();
    });

    it('should provide working Path2D', () => {
        env = createIsolatedEnvironment();

        const Path2DCtor = env.window.Path2D;
        expect(Path2DCtor).toBeDefined();

        // Verify it's the real implementation by instantiating and checking methods
        const path = new Path2DCtor();
        expect(typeof path.moveTo).toBe('function');
        expect(typeof path.lineTo).toBe('function');
    });

    it('should create independent environments', () => {
        const env1 = createIsolatedEnvironment();
        const env2 = createIsolatedEnvironment();

        try {
            // Add content to env1
            const div1 = env1.document.createElement('div');
            div1.id = 'test1';
            env1.document.body.appendChild(div1);

            // env2 should not have this element
            expect(env2.document.getElementById('test1')).toBeNull();
        } finally {
            env1.dispose();
            env2.dispose();
        }
    });

    it('should properly dispose environment', () => {
        const localEnv = createIsolatedEnvironment();

        // Dispose should not throw
        expect(() => localEnv.dispose()).not.toThrow();
    });
});
