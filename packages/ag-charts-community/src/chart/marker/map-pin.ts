import { Marker } from './marker';

export class MapPin extends Marker {
    static override readonly className = 'Square';

    override center = { x: 0.5, y: 1 };

    override updatePath() {
        const { path, x, y } = this;
        const s = this.size;
        const { x: cx, y: cy } = this.center;

        path.clear();

        /**
         * M 0.1875 0.3125
         * C 0.1875 0.139911 0.327411 0.0 0.5 0.0
         * C 0.672589 0.0 0.8125 0.139911 0.8125 0.3125
         * C 0.8125 0.430014 0.750905 0.5437 0.694129 0.648492
         * C 0.692643 0.651234 0.691161 0.65397 0.689683 0.6567
         * C 0.638061 0.752052 0.587087 0.846847 0.560634 0.952658
         * C 0.553678 0.980481 0.528679 1.0 0.5 1.0
         * C 0.471321 1.0 0.446322 0.980481 0.439366 0.952658
         * C 0.412913 0.846847 0.361939 0.752052 0.310317 0.6567
         * C 0.308839 0.65397 0.307357 0.651234 0.305871 0.648492
         * C 0.249095 0.5437 0.1875 0.430014 0.1875 0.3125
         * Z
         */

        path.moveTo(x + (0.1875 - cx) * s, y + (0.3125 - cy) * s);
        path.cubicCurveTo(
            x + (0.1875 - cx) * s,
            y + (0.139911 - cy) * s,
            x + (0.327411 - cx) * s,
            y + (0.0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (0.0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.672589 - cx) * s,
            y + (0.0 - cy) * s,
            x + (0.8125 - cx) * s,
            y + (0.139911 - cy) * s,
            x + (0.8125 - cx) * s,
            y + (0.3125 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.8125 - cx) * s,
            y + (0.430014 - cy) * s,
            x + (0.750905 - cx) * s,
            y + (0.5437 - cy) * s,
            x + (0.694129 - cx) * s,
            y + (0.648492 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.692643 - cx) * s,
            y + (0.651234 - cy) * s,
            x + (0.691161 - cx) * s,
            y + (0.65397 - cy) * s,
            x + (0.689683 - cx) * s,
            y + (0.6567 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.638061 - cx) * s,
            y + (0.752052 - cy) * s,
            x + (0.587087 - cx) * s,
            y + (0.846847 - cy) * s,
            x + (0.560634 - cx) * s,
            y + (0.952658 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.553678 - cx) * s,
            y + (0.980481 - cy) * s,
            x + (0.528679 - cx) * s,
            y + (1.0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (1.0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.471321 - cx) * s,
            y + (1.0 - cy) * s,
            x + (0.446322 - cx) * s,
            y + (0.980481 - cy) * s,
            x + (0.439366 - cx) * s,
            y + (0.952658 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.412913 - cx) * s,
            y + (0.846847 - cy) * s,
            x + (0.361939 - cx) * s,
            y + (0.752052 - cy) * s,
            x + (0.310317 - cx) * s,
            y + (0.6567 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.308839 - cx) * s,
            y + (0.65397 - cy) * s,
            x + (0.307357 - cx) * s,
            y + (0.651234 - cy) * s,
            x + (0.305871 - cx) * s,
            y + (0.648492 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.249095 - cx) * s,
            y + (0.5437 - cy) * s,
            x + (0.1875 - cx) * s,
            y + (0.430014 - cy) * s,
            x + (0.1875 - cx) * s,
            y + (0.3125 - cy) * s
        );
        path.closePath();
    }
}
