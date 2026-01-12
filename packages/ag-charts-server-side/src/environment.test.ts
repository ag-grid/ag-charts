import { createIsolatedEnvironment } from './environment';

describe('createIsolatedEnvironment', () => {
    it('should create an isolated environment with window and document', () => {
        const env = createIsolatedEnvironment();

        try {
            expect(env.window).toBeDefined();
            expect(env.document).toBeDefined();
            expect(typeof env.dispose).toBe('function');
        } finally {
            env.dispose();
        }
    });

    it('should provide a container element', () => {
        const env = createIsolatedEnvironment();

        try {
            const container = env.document.getElementById('container');
            expect(container).toBeDefined();
            expect(container?.tagName.toLowerCase()).toBe('div');
        } finally {
            env.dispose();
        }
    });

    it('should polyfill requestAnimationFrame', () => {
        const env = createIsolatedEnvironment();

        try {
            expect(typeof env.window.requestAnimationFrame).toBe('function');
            expect(typeof env.window.cancelAnimationFrame).toBe('function');
        } finally {
            env.dispose();
        }
    });

    it('should provide OffscreenCanvas', () => {
        const env = createIsolatedEnvironment();

        try {
            expect(env.window.OffscreenCanvas).toBeDefined();
        } finally {
            env.dispose();
        }
    });

    it('should provide DOMMatrix', () => {
        const env = createIsolatedEnvironment();

        try {
            expect(env.window.DOMMatrix).toBeDefined();
        } finally {
            env.dispose();
        }
    });

    it('should provide Image', () => {
        const env = createIsolatedEnvironment();

        try {
            expect(env.window.Image).toBeDefined();
        } finally {
            env.dispose();
        }
    });

    it('should provide Path2D', () => {
        const env = createIsolatedEnvironment();

        try {
            expect(env.window.Path2D).toBeDefined();
        } finally {
            env.dispose();
        }
    });

    it('should set agChartsSceneRenderModel to composite', () => {
        const env = createIsolatedEnvironment();

        try {
            const win = env.window as Window & { agChartsSceneRenderModel?: string };
            expect(win.agChartsSceneRenderModel).toBe('composite');
        } finally {
            env.dispose();
        }
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
        const env = createIsolatedEnvironment();

        // Dispose should not throw
        expect(() => env.dispose()).not.toThrow();
    });
});
