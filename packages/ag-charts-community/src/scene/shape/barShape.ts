import { SceneChangeDetection } from '../changeDetectable';
import { Rect } from './rect';

export class BarShape<D = any> extends Rect<D> {
    @SceneChangeDetection()
    featherRatioY: number = 0;

    private get feathered() {
        return Math.abs(this.featherRatioY) > 1e-6;
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

        const { path, x, y, width, height, featherRatioY } = this;
        path.clear();

        const midX = x + width / 2;
        const featherInset = Math.abs(featherRatioY) * height;

        if (featherRatioY > 0) {
            path.moveTo(x, y + featherInset);
            path.lineTo(midX, y);
            path.lineTo(x + width, y + featherInset);
            path.lineTo(x + width, y + height);
            path.lineTo(x, y + height);
            path.closePath();
        } else {
            path.moveTo(x, y);
            path.lineTo(x + width, y);
            path.lineTo(x + width, y + height - featherInset);
            path.lineTo(midX, y + height);
            path.lineTo(x, y + height - featherInset);
            path.closePath();
        }
    }
}
