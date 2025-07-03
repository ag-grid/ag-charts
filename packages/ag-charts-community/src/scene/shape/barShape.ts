import { SceneChangeDetection } from '../changeDetectable';
import { Rect } from './rect';

export class BarShape<D = any> extends Rect<D> {
    @SceneChangeDetection()
    direction: 'x' | 'y' = 'x';

    @SceneChangeDetection()
    featherRatio: number = 0;

    private get feathered() {
        return Math.abs(this.featherRatio) > 1e-6;
    }

    override isPointInPath(x: number, y: number): boolean {
        if (!this.feathered) {
            return super.isPointInPath(x, y);
        }

        const bbox = this.getBBox();
        return bbox.containsPoint(x, y);
    }

    override updatePath(): void {
        if (!this.feathered) {
            super.updatePath();
            return;
        }

        const { path, x, y, width, height, direction, featherRatio } = this;
        path.clear();

        if (direction === 'x') {
            const featherInsetX = Math.abs(featherRatio) * width;

            if (featherRatio > 0) {
                path.moveTo(x, y);
                path.lineTo(x + width - featherInsetX, y);
                path.lineTo(x + width, y + height / 2);
                path.lineTo(x + width - featherInsetX, y + height);
                path.lineTo(x, y + height);
                path.closePath();
            } else {
                path.moveTo(x + featherInsetX, y);
                path.lineTo(x + width, y);
                path.lineTo(x + width, y + height);
                path.lineTo(x + featherInsetX, y + height);
                path.lineTo(x, y + height / 2);
                path.closePath();
            }
        } else {
            const featherInsetY = Math.abs(featherRatio) * height;

            if (featherRatio > 0) {
                path.moveTo(x, y + featherInsetY);
                path.lineTo(x + width / 2, y);
                path.lineTo(x + width, y + featherInsetY);
                path.lineTo(x + width, y + height);
                path.lineTo(x, y + height);
                path.closePath();
            } else {
                path.moveTo(x, y);
                path.lineTo(x + width, y);
                path.lineTo(x + width, y + height - featherInsetY);
                path.lineTo(x + width / 2, y + height);
                path.lineTo(x, y + height - featherInsetY);
                path.closePath();
            }
        }
    }
}
