import { Translatable } from '../transformable';
import { Path } from './path';

export class SvgPath<D = any> extends Path<D> {
    private _d: string = '';
    get d() {
        return this._d;
    }
    set d(d: string) {
        if (d === this._d) return;

        this._d = d;
        this.path.clear();
        this.path.appendSvg(d);
        this.checkPathDirty();
    }

    constructor(d: string = '') {
        super();

        this.d = d;
    }
}

export class TranslatableSvgPath extends Translatable(SvgPath) {
    override isPointInPath(x: number, y: number) {
        return super.isPointInPath(x - this.translationX, y - this.translationY);
    }
}
