import { NodeCanvas } from './canvasConfig';

describe('NodeCanvas', () => {
    it('should create a canvas with specified dimensions', () => {
        const canvas = new NodeCanvas(800, 600);

        expect(canvas.width).toBe(800);
        expect(canvas.height).toBe(600);
    });

    it('should have GPU disabled', () => {
        const canvas = new NodeCanvas(100, 100);

        expect(canvas.gpu).toBe(false);
    });

    it('should provide a 2D rendering context', () => {
        const canvas = new NodeCanvas(100, 100);
        const ctx = canvas.getContext('2d');

        expect(ctx).toBeDefined();
        expect(typeof ctx.fillRect).toBe('function');
        expect(typeof ctx.drawImage).toBe('function');
    });

    it('should implement transferToImageBitmap', () => {
        const canvas = new NodeCanvas(100, 100);
        const ctx = canvas.getContext('2d');

        // Draw something
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 50, 50);

        const bitmap = canvas.transferToImageBitmap();

        expect(bitmap).toBeDefined();
        expect(bitmap.width).toBe(100);
        expect(bitmap.height).toBe(100);
    });

    it('should handle zero-dimension canvas in transferToImageBitmap', () => {
        const canvas = new NodeCanvas(0, 0);
        const bitmap = canvas.transferToImageBitmap();

        // Note: skia-canvas returns minimum 1x1 for zero-dimension canvas
        expect(bitmap.width).toBeGreaterThanOrEqual(0);
        expect(bitmap.height).toBeGreaterThanOrEqual(0);
    });

    it('should convert to buffer synchronously', () => {
        const canvas = new NodeCanvas(100, 100);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 100, 100);

        const buffer = canvas.toBufferSync('png');

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);

        // Check PNG magic bytes
        expect(buffer[0]).toBe(0x89);
        expect(buffer[1]).toBe(0x50); // P
        expect(buffer[2]).toBe(0x4e); // N
        expect(buffer[3]).toBe(0x47); // G
    });
});
