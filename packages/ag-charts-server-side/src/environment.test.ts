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

    it('should provide OffscreenCanvas', () => {
        env = createIsolatedEnvironment();

        expect(env.window.OffscreenCanvas).toBeDefined();
    });

    it('should provide DOMMatrix', () => {
        env = createIsolatedEnvironment();

        expect(env.window.DOMMatrix).toBeDefined();
    });

    it('should provide Image', () => {
        env = createIsolatedEnvironment();

        expect(env.window.Image).toBeDefined();
    });

    it('should provide Path2D', () => {
        env = createIsolatedEnvironment();

        expect(env.window.Path2D).toBeDefined();
    });

    it('should set agChartsSceneRenderModel to composite', () => {
        env = createIsolatedEnvironment();

        const win = env.window as Window & { agChartsSceneRenderModel?: string };
        expect(win.agChartsSceneRenderModel).toBe('composite');
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
