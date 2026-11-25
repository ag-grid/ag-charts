import { vi } from 'vitest';

/** jsdom has no Path2D; `ExtendedPath2D` geometry is read from its recorded commands, never the native path. */
export function stubPath2D() {
    vi.stubGlobal(
        'Path2D',
        class {
            moveTo() {}
            lineTo() {}
            bezierCurveTo() {}
            closePath() {}
        }
    );
}
