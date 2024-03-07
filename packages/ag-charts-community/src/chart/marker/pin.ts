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
         * M 0.15625 0.34375
         * C 0.15625 0.151491 0.307741 0.0 0.5 0.0
         * C 0.692259 0.0 0.84375 0.151491 0.84375 0.34375
         * C 0.84375 0.493824 0.784625 0.600181 0.716461 0.695393
         * C 0.699009 0.719769 0.681271 0.743104 0.663785 0.766105
         * C 0.611893 0.834367 0.562228 0.899699 0.528896 0.980648
         * C 0.524075 0.992358 0.512663 1.0 0.5 1.0
         * C 0.487337 1.0 0.475925 0.992358 0.471104 0.980648
         * C 0.437772 0.899699 0.388107 0.834367 0.336215 0.766105
         * C 0.318729 0.743104 0.300991 0.719769 0.283539 0.695393
         * C 0.215375 0.600181 0.15625 0.493824 0.15625 0.34375
         * Z
         * */

        path.moveTo(x + (0.15625 - cx) * s, y + (0.34375 - cy) * s);
        path.cubicCurveTo(
            x + (0.15625 - cx) * s,
            y + (0.151491 - cy) * s,
            x + (0.307741 - cx) * s,
            y + (0.0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (0.0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.692259 - cx) * s,
            y + (0.0 - cy) * s,
            x + (0.84375 - cx) * s,
            y + (0.151491 - cy) * s,
            x + (0.84375 - cx) * s,
            y + (0.34375 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.84375 - cx) * s,
            y + (0.493824 - cy) * s,
            x + (0.784625 - cx) * s,
            y + (0.600181 - cy) * s,
            x + (0.716461 - cx) * s,
            y + (0.695393 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.699009 - cx) * s,
            y + (0.719769 - cy) * s,
            x + (0.681271 - cx) * s,
            y + (0.743104 - cy) * s,
            x + (0.663785 - cx) * s,
            y + (0.766105 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.611893 - cx) * s,
            y + (0.834367 - cy) * s,
            x + (0.562228 - cx) * s,
            y + (0.899699 - cy) * s,
            x + (0.528896 - cx) * s,
            y + (0.980648 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.524075 - cx) * s,
            y + (0.992358 - cy) * s,
            x + (0.512663 - cx) * s,
            y + (1.0 - cy) * s,
            x + (0.5 - cx) * s,
            y + (1.0 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.487337 - cx) * s,
            y + (1.0 - cy) * s,
            x + (0.475925 - cx) * s,
            y + (0.992358 - cy) * s,
            x + (0.471104 - cx) * s,
            y + (0.980648 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.487337 - cx) * s,
            y + (1.0 - cy) * s,
            x + (0.475925 - cx) * s,
            y + (0.992358 - cy) * s,
            x + (0.471104 - cx) * s,
            y + (0.980648 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.437772 - cx) * s,
            y + (0.899699 - cy) * s,
            x + (0.388107 - cx) * s,
            y + (0.834367 - cy) * s,
            x + (0.336215 - cx) * s,
            y + (0.766105 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.318729 - cx) * s,
            y + (0.743104 - cy) * s,
            x + (0.300991 - cx) * s,
            y + (0.719769 - cy) * s,
            x + (0.283539 - cx) * s,
            y + (0.695393 - cy) * s
        );
        path.cubicCurveTo(
            x + (0.215375 - cx) * s,
            y + (0.600181 - cy) * s,
            x + (0.15625 - cx) * s,
            y + (0.493824 - cy) * s,
            x + (0.15625 - cx) * s,
            y + (0.34375 - cy) * s
        );
        path.closePath();
    }
}
