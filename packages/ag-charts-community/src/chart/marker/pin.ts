import { Marker } from './marker';

export class Pin extends Marker {
    static override readonly className = 'MapPin';

    static override center = { x: 0.5, y: 1 };

    override updatePath() {
        const { path, x, y } = this;
        const s = this.size;

        const cx = 0.5;
        const cy = 1;

        path.clear();

        /**
         * M 0.1875 0.3125
         * C 0.1875 0.139911 0.327411 0.0 0.5 0.0
         * C 0.672589 0.0 0.8125 0.139911 0.8125 0.3125
         * C 0.8125 0.345198 0.807468 0.376779 0.798113 0.40648
         * C 0.775147 0.486366 0.72717 0.570007 0.679087 0.65383
         * L 0.677743 0.656174
         * C 0.618444 0.759556 0.55811 0.865156 0.530317 0.976329
         * C 0.526839 0.990241 0.51434 1.0 0.5 1.0
         * C 0.48566 1.0 0.473161 0.990241 0.469683 0.976329
         * C 0.44189 0.865156 0.381556 0.759556 0.322257 0.656174
         * L 0.320913 0.653831
         * C 0.272831 0.570008 0.224853 0.486367 0.201888 0.406481
         * C 0.192533 0.37678 0.1875 0.345198 0.1875 0.3125
         * Z
         * */

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
            y + (0.345198 - cy) * s,
            x + (0.807468 - cx) * s,
            y + (0.376779 - cy) * s,
            x + (0.798113 - cx) * s,
            y + (0.40648 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.775147 - cx) * s,
            y + (0.486366 - cy) * s,
            x + (0.72717 - cx) * s,
            y + (0.570007 - cy) * s,
            x + (0.679087 - cx) * s,
            y + (0.65383 - cy) * s
        );
        path.lineTo(x + (0.677743 - cx) * s, y + (0.656174 - cy) * s);
        path.cubicCurveTo(
            x + (0.618444 - cx) * s,
            y + (0.759556 - cy) * s,
            x + (0.55811 - cx) * s,
            y + (0.865156 - cy) * s,
            x + (0.530317 - cx) * s,
            y + (0.976329 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.526839 - cx) * s,
            y + (0.990241 - cy) * s,
            x + (0.51434 - cx) * s,
            y + (1.0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (1.0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.48566 - cx) * s,
            y + (1.0 - cy) * s,
            x + (0.473161 - cx) * s,
            y + (0.990241 - cy) * s,
            x + (0.469683 - cx) * s,
            y + (0.976329 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.44189 - cx) * s,
            y + (0.865156 - cy) * s,
            x + (0.381556 - cx) * s,
            y + (0.759556 - cy) * s,
            x + (0.322257 - cx) * s,
            y + (0.656174 - cy) * s
        );
        path.lineTo(x + (0.320913 - cx) * s, y + (0.653831 - cy) * s);
        path.cubicCurveTo(
            x + (0.272831 - cx) * s,
            y + (0.570008 - cy) * s,
            x + (0.224853 - cx) * s,
            y + (0.486367 - cy) * s,
            x + (0.201888 - cx) * s,
            y + (0.406481 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.192533 - cx) * s,
            y + (0.37678 - cy) * s,
            x + (0.1875 - cx) * s,
            y + (0.345198 - cy) * s,
            x + (0.1875 - cx) * s,
            y + (0.3125 - cy) * s
        );
        path.closePath();
    }
}
