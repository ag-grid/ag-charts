import { Scale } from "../scale/scale";
import { Axis } from "../axis";
import { Series } from "./series/series";

export enum ChartAxisDirection {
    X = 'x', // means 'angle' in polar charts
    Y = 'y'  // means 'radius' in polar charts
}

export function flipChartAxisDirection(direction: ChartAxisDirection): ChartAxisDirection {
    if (direction === ChartAxisDirection.X) {
        return ChartAxisDirection.Y;
    } else {
        return ChartAxisDirection.X;
    }
}

export enum ChartAxisPosition {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left',
    Angle = 'angle',
    Radius = 'radius'
}

interface ChartAxisMeta {
    id: string;
    direction: ChartAxisDirection;
    boundSeries: Series[];
}

export class ChartAxis<S extends Scale<any, number> = Scale<any, number>> extends Axis<S> {
    keys: string[] = [];
    direction: ChartAxisDirection = ChartAxisDirection.Y;
    boundSeries: Series[] = [];
    linkedTo?: ChartAxis;

    get type(): string {
        return (this.constructor as any).type || '';
    }

    getMeta(): ChartAxisMeta {
        return {
            id: this.id,
            direction: this.direction,
            boundSeries: this.boundSeries,
        };
    }

    protected _position: ChartAxisPosition = ChartAxisPosition.Left;
    set position(value: ChartAxisPosition) {
        if (this._position !== value) {
            this._position = value;
            switch (value) {
                case ChartAxisPosition.Top:
                    this.direction = ChartAxisDirection.X;
                    this.rotation = -90;
                    this.label.mirrored = true;
                    this.label.parallel = true;
                    break;
                case ChartAxisPosition.Right:
                    this.direction = ChartAxisDirection.Y;
                    this.rotation = 0;
                    this.label.mirrored = true;
                    this.label.parallel = false;
                    break;
                case ChartAxisPosition.Bottom:
                    this.direction = ChartAxisDirection.X;
                    this.rotation = -90;
                    this.label.mirrored = false;
                    this.label.parallel = true;
                    break;
                case ChartAxisPosition.Left:
                    this.direction = ChartAxisDirection.Y;
                    this.rotation = 0;
                    this.label.mirrored = false;
                    this.label.parallel = false;
                    break;
            }
        }
    }
    get position(): ChartAxisPosition {
        return this._position;
    }
}
