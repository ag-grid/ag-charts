// For small data structs like a bounding box, objects are superior to arrays
import { Interpolating, interpolate } from '../util/interpolating';

export class SectorBox implements Interpolating<SectorBox> {
    constructor(
        public startAngle: number,
        public endAngle: number,
        public innerRadius: number,
        public outerRadius: number
    ) {}

    clone() {
        const { startAngle, endAngle, innerRadius, outerRadius } = this;
        return new SectorBox(startAngle, endAngle, innerRadius, outerRadius);
    }

    [interpolate](other: SectorBox, d: number) {
        return new SectorBox(
            this.startAngle * (1 - d) + other.startAngle * d,
            this.endAngle * (1 - d) + other.endAngle * d,
            this.innerRadius * (1 - d) + other.innerRadius * d,
            this.outerRadius * (1 - d) + other.outerRadius * d
        );
    }
}
